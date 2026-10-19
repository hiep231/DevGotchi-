import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { PetMood, PetType } from '../../types/pet';

interface PetCanvasProps {
  type: PetType;
  mood?: PetMood;
  isFeeding?: boolean;
  activeFoodIcon?: string;
  isInteractive?: boolean;
  pokeTrigger?: number;
  feedTrigger?: number;
  className?: string;
}

export const PetCanvas: React.FC<PetCanvasProps> = ({
  type,
  mood = 'HAPPY',
  isFeeding = false,
  isInteractive = true,
  pokeTrigger = 0,
  feedTrigger = 0,
  className = 'w-full h-80',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const petGroupRef = useRef<THREE.Group | null>(null);
  const foodMeshRef = useRef<THREE.Mesh | null>(null);
  const mouthRef = useRef<THREE.Mesh | null>(null);
  const leftEyeRef = useRef<THREE.Group | null>(null);
  const rightEyeRef = useRef<THREE.Group | null>(null);

  // Animation state refs
  const mousePos = useRef({ x: 0, y: 0 });
  const animTime = useRef(0);
  const pokeBounce = useRef(0);
  const feedProgress = useRef(0);

  // Trigger poke animation
  useEffect(() => {
    if (pokeTrigger > 0) {
      pokeBounce.current = 1.0;
    }
  }, [pokeTrigger]);

  // Trigger feed animation
  useEffect(() => {
    if (feedTrigger > 0) {
      feedProgress.current = 1.0;
    }
  }, [feedTrigger]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene & Camera Setup
    const width = container.clientWidth || 320;
    const height = container.clientHeight || 320;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 5.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.replaceChildren(renderer.domElement);

    // 2. Lighting Setup (Soft Studio Clay Lighting)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xfff7ed, 2.0);
    mainLight.position.set(3, 5, 4);
    mainLight.castShadow = true;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xbae6fd, 1.2);
    fillLight.position.set(-4, -2, 2);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xffedd5, 1.5, 10);
    rimLight.position.set(0, 3, -3);
    scene.add(rimLight);

    // 3. Build 3D Pet Character
    const petGroup = new THREE.Group();
    petGroupRef.current = petGroup;
    scene.add(petGroup);

    buildPetMesh(petGroup, type, mood, mouthRef, leftEyeRef, rightEyeRef);

    // 4. Food Mesh for feeding interaction
    const foodGeo = new THREE.DodecahedronGeometry(0.24, 1);
    const foodMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      roughness: 0.2,
      metalness: 0.1,
      emissive: 0xffedd5,
      emissiveIntensity: 0.3,
    });
    const foodMesh = new THREE.Mesh(foodGeo, foodMat);
    foodMesh.position.set(0, -2, 0.5);
    foodMesh.visible = false;
    foodMeshRef.current = foodMesh;
    scene.add(foodMesh);

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      if (!isInteractive) return;
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mousePos.current = { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Handle Resize
    const handleResize = () => {
      if (!container || !rendererRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 5. Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      animTime.current += delta;
      const t = animTime.current;

      if (petGroupRef.current) {
        // Natural floating bobbing
        const isSleep = mood === 'SLEEPING';
        const bobSpeed = isSleep ? 1.2 : 2.5;
        const bobHeight = isSleep ? 0.05 : 0.12;
        const floatY = Math.sin(t * bobSpeed) * bobHeight;

        // Smooth look-at mouse parallax
        const targetRotY = mousePos.current.x * 0.45;
        const targetRotX = -mousePos.current.y * 0.35;
        petGroupRef.current.rotation.y += (targetRotY - petGroupRef.current.rotation.y) * 0.08;
        petGroupRef.current.rotation.x += (targetRotX - petGroupRef.current.rotation.x) * 0.08;

        // Poke Squash & Stretch Bounce
        if (pokeBounce.current > 0.01) {
          pokeBounce.current *= 0.92;
          const bounce = Math.sin(pokeBounce.current * Math.PI * 4) * pokeBounce.current;
          petGroupRef.current.scale.set(1 - bounce * 0.25, 1 + bounce * 0.35, 1 - bounce * 0.25);
          petGroupRef.current.position.y = floatY + bounce * 0.5;
        } else {
          petGroupRef.current.scale.set(1, 1, 1);
          petGroupRef.current.position.y = floatY;
        }

        // Eyes spiral animation when Dizzy
        if (mood === 'DIZZY' && leftEyeRef.current && rightEyeRef.current) {
          leftEyeRef.current.rotation.z = t * 6;
          rightEyeRef.current.rotation.z = -t * 6;
        }

        // Feeding Animation
        if (feedProgress.current > 0.01) {
          feedProgress.current -= delta * 0.8;
          if (foodMeshRef.current) {
            foodMeshRef.current.visible = true;
            // Arc trajectory towards mouth
            const p = 1.0 - feedProgress.current;
            foodMeshRef.current.position.y = -1.5 + p * 1.5;
            foodMeshRef.current.position.z = 0.5 - p * 0.4;
            foodMeshRef.current.rotation.x += delta * 6;
            foodMeshRef.current.rotation.y += delta * 8;
            foodMeshRef.current.scale.setScalar(Math.max(0.01, 1 - p * 0.8));

            // Pet opens mouth and chomps
            if (mouthRef.current) {
              const mouthOpen = Math.sin(p * Math.PI) * 0.5;
              mouthRef.current.scale.set(1 + mouthOpen, 1 + mouthOpen * 1.5, 1);
            }
          }
        } else {
          if (foodMeshRef.current) foodMeshRef.current.visible = false;
          if (mouthRef.current) mouthRef.current.scale.set(1, 1, 1);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, [type, mood]);

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center cursor-pointer select-none ${className}`}
      title="Click để tương tác với thú cưng!"
    />
  );
};

// --------------------------------------------------------------------------
// Procedural 3D Mesh Builders for the 4 Starters
// --------------------------------------------------------------------------
function buildPetMesh(
  group: THREE.Group,
  type: PetType,
  mood: PetMood,
  mouthRef: React.MutableRefObject<THREE.Mesh | null>,
  leftEyeRef: React.MutableRefObject<THREE.Group | null>,
  rightEyeRef: React.MutableRefObject<THREE.Group | null>
) {
  group.clear();

  if (type === 'PUFFY') {
    // =========================================================================
    // 🐡 PUFFY: Pufferfish (Accurately inspired by user reference image!)
    // =========================================================================
    // Main Body: Cyan Blue Sphere
    const bodyGeo = new THREE.SphereGeometry(1.0, 36, 36);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8, // vibrant cyan
      roughness: 0.25,
      metalness: 0.05,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    group.add(body);

    // Soft Cream Belly (Bottom Sphere)
    const bellyGeo = new THREE.SphereGeometry(0.72, 32, 24);
    const bellyMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a, // soft pastel yellow
      roughness: 0.35,
    });
    const belly = new THREE.Mesh(bellyGeo, bellyMat);
    belly.position.set(0, -0.42, 0.35);
    belly.scale.set(1.05, 0.65, 0.85);
    group.add(belly);

    // Spikes (Soft Yellow Rubber Cones)
    const spikeGeo = new THREE.ConeGeometry(0.12, 0.32, 16);
    const spikeMat = new THREE.MeshStandardMaterial({
      color: 0xfde047, // yellow
      roughness: 0.3,
    });

    const spikePositions = [
      // Top spines
      { pos: [0, 1.05, 0], rot: [0, 0, 0] },
      { pos: [-0.35, 1.0, 0.1], rot: [0, 0, 0.35] },
      { pos: [0.35, 1.0, 0.1], rot: [0, 0, -0.35] },
      { pos: [0, 0.95, -0.35], rot: [-0.35, 0, 0] },
      // Side spines
      { pos: [-1.02, 0.1, 0], rot: [0, 0, 1.5] },
      { pos: [1.02, 0.1, 0], rot: [0, 0, -1.5] },
      // Bottom spines
      { pos: [-0.35, -1.0, 0], rot: [0, 0, 2.7] },
      { pos: [0.35, -1.0, 0], rot: [0, 0, -2.7] },
    ];

    spikePositions.forEach(({ pos, rot }) => {
      const spike = new THREE.Mesh(spikeGeo, spikeMat);
      spike.position.set(pos[0], pos[1], pos[2]);
      spike.rotation.set(rot[0], rot[1], rot[2]);
      group.add(spike);
    });

    // Side Flippers (Fins)
    const finGeo = new THREE.SphereGeometry(0.2, 16, 16);
    finGeo.scale(0.3, 1.2, 0.8);
    const finMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 });

    const leftFin = new THREE.Mesh(finGeo, finMat);
    leftFin.position.set(-0.85, -0.3, 0.4);
    leftFin.rotation.set(0.3, 0, 0.6);
    group.add(leftFin);

    const rightFin = new THREE.Mesh(finGeo, finMat);
    rightFin.position.set(0.85, -0.3, 0.4);
    rightFin.rotation.set(0.3, 0, -0.6);
    group.add(rightFin);

    // Back Tail Fin
    const tailGroup = new THREE.Group();
    const tailGeo = new THREE.CylinderGeometry(0.08, 0.35, 0.5, 16);
    tailGeo.scale(0.4, 1.2, 1);
    const tailFin = new THREE.Mesh(tailGeo, finMat);
    tailFin.rotation.x = Math.PI / 2;
    tailFin.position.set(0, 0, -1.05);
    tailGroup.add(tailFin);
    group.add(tailGroup);

    // Mouth: Donut/O-shape Pink Lips (like in the image)
    const mouthGeo = new THREE.TorusGeometry(0.14, 0.05, 16, 32);
    const mouthMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e, // coral pink
      roughness: 0.2,
    });
    const mouth = new THREE.Mesh(mouthGeo, mouthMat);
    mouth.position.set(0, -0.15, 0.98);
    mouthRef.current = mouth;
    group.add(mouth);

    // Eyes: Stylized Spiral/Chibi Eyes
    const createPuffyEye = (isLeft: boolean) => {
      const eyeGroup = new THREE.Group();
      // White eye sphere
      const eyeWhiteGeo = new THREE.SphereGeometry(0.25, 24, 24);
      const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
      const eyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
      eyeWhite.scale.set(1, 1, 0.5);
      eyeGroup.add(eyeWhite);

      if (mood === 'DIZZY') {
        // Spiral Eyes! (like in user image)
        const spiralGeo = new THREE.RingGeometry(0.06, 0.18, 16, 2, 0, Math.PI * 3.5);
        const spiralMat = new THREE.MeshBasicMaterial({ color: 0x1e293b, side: THREE.DoubleSide });
        const spiral = new THREE.Mesh(spiralGeo, spiralMat);
        spiral.position.z = 0.14;
        eyeGroup.add(spiral);
      } else if (mood === 'SLEEPING') {
        // Closed cute sleepy line
        const lineGeo = new THREE.BoxGeometry(0.22, 0.04, 0.05);
        const lineMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.position.z = 0.14;
        eyeGroup.add(line);
      } else {
        // Normal shiny anime/chibi pupil
        const pupilGeo = new THREE.SphereGeometry(0.12, 16, 16);
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
        const pupil = new THREE.Mesh(pupilGeo, pupilMat);
        pupil.position.set(0, 0, 0.12);
        eyeGroup.add(pupil);

        // White sparkle highlight
        const glintGeo = new THREE.SphereGeometry(0.045, 12, 12);
        const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const glint = new THREE.Mesh(glintGeo, glintMat);
        glint.position.set(0.04, 0.04, 0.22);
        eyeGroup.add(glint);
      }

      eyeGroup.position.set(isLeft ? -0.38 : 0.38, 0.24, 0.82);
      eyeGroup.rotation.y = isLeft ? -0.2 : 0.2;
      return eyeGroup;
    };

    const leftEye = createPuffyEye(true);
    const rightEye = createPuffyEye(false);
    leftEyeRef.current = leftEye;
    rightEyeRef.current = rightEye;
    group.add(leftEye);
    group.add(rightEye);
  } else if (type === 'BYTEY') {
    // =========================================================================
    // 🐱 BYTEY: Cyber Cat (Soft Bean Body, Cat Ears, USB Tail)
    // =========================================================================
    const catBodyGeo = new THREE.SphereGeometry(0.9, 32, 32);
    catBodyGeo.scale(1, 1.15, 0.95);
    const catBodyMat = new THREE.MeshStandardMaterial({ color: 0xc084fc, roughness: 0.3 });
    const catBody = new THREE.Mesh(catBodyGeo, catBodyMat);
    group.add(catBody);

    // Belly patch
    const bellyGeo = new THREE.SphereGeometry(0.55, 24, 24);
    const bellyMat = new THREE.MeshStandardMaterial({ color: 0xfae8ff, roughness: 0.4 });
    const belly = new THREE.Mesh(bellyGeo, bellyMat);
    belly.position.set(0, -0.2, 0.48);
    belly.scale.set(0.9, 1.1, 0.4);
    group.add(belly);

    // Cat Ears
    const earGeo = new THREE.ConeGeometry(0.3, 0.5, 16);
    const earMat = new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.3 });
    const leftEar = new THREE.Mesh(earGeo, earMat);
    leftEar.position.set(-0.48, 0.95, 0);
    leftEar.rotation.z = 0.35;
    group.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, earMat);
    rightEar.position.set(0.48, 0.95, 0);
    rightEar.rotation.z = -0.35;
    group.add(rightEar);

    // Glowing USB Cable Tail
    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.5, -0.8),
      new THREE.Vector3(0.3, -0.1, -1.1),
      new THREE.Vector3(0.1, 0.4, -0.9),
      new THREE.Vector3(-0.1, 0.6, -0.7),
    ]);
    const tailTubeGeo = new THREE.TubeGeometry(tailCurve, 20, 0.06, 8, false);
    const tailTubeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
    });
    const tailTube = new THREE.Mesh(tailTubeGeo, tailTubeMat);
    group.add(tailTube);

    // Big Anime Eyes
    addCuteEyes(group, leftEyeRef, rightEyeRef, mood, 0.35, 0.2, 0.85);
  } else if (type === 'GOLEMY') {
    // =========================================================================
    // 🪨 GOLEMY: Server Golem (Beveled Cube, Sprout, LED Eyes)
    // =========================================================================
    const golemGeo = new THREE.BoxGeometry(1.4, 1.4, 1.4);
    const golemMat = new THREE.MeshStandardMaterial({
      color: 0x34d399, // emerald stone
      roughness: 0.4,
      metalness: 0.1,
    });
    const golem = new THREE.Mesh(golemGeo, golemMat);
    group.add(golem);

    // Sprout on head
    const stemGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.4, 8);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x15803d });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.set(0, 0.9, 0);
    group.add(stem);

    // Sprout leaves
    const leafGeo = new THREE.SphereGeometry(0.15, 12, 12);
    leafGeo.scale(1.5, 0.3, 0.8);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x4ade80 });
    const leftLeaf = new THREE.Mesh(leafGeo, leafMat);
    leftLeaf.position.set(-0.15, 1.05, 0);
    leftLeaf.rotation.z = -0.4;
    group.add(leftLeaf);

    const rightLeaf = new THREE.Mesh(leafGeo, leafMat);
    rightLeaf.position.set(0.15, 1.05, 0);
    rightLeaf.rotation.z = 0.4;
    group.add(rightLeaf);

    // LED Eyes
    const ledGeo = new THREE.BoxGeometry(0.28, 0.12, 0.08);
    const ledMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfacc15,
      emissiveIntensity: 1.2,
    });
    const leftLed = new THREE.Mesh(ledGeo, ledMat);
    leftLed.position.set(-0.35, 0.15, 0.72);
    group.add(leftLed);

    const rightLed = new THREE.Mesh(ledGeo, ledMat);
    rightLed.position.set(0.35, 0.15, 0.72);
    group.add(rightLed);
  } else if (type === 'OCTY') {
    // =========================================================================
    // 🐙 OCTY: Git Kraken (Round Pink Body, Wobbly Tentacles)
    // =========================================================================
    const octBodyGeo = new THREE.SphereGeometry(0.95, 32, 32);
    const octBodyMat = new THREE.MeshStandardMaterial({ color: 0xfb7185, roughness: 0.25 });
    const octBody = new THREE.Mesh(octBodyGeo, octBodyMat);
    group.add(octBody);

    // 6 Tentacles
    const tentacleGeo = new THREE.CylinderGeometry(0.1, 0.18, 0.5, 12);
    const tentacleMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.3 });
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const tentacle = new THREE.Mesh(tentacleGeo, tentacleMat);
      tentacle.position.set(Math.cos(angle) * 0.75, -0.75, Math.sin(angle) * 0.75);
      tentacle.rotation.z = -Math.cos(angle) * 0.4;
      tentacle.rotation.x = Math.sin(angle) * 0.4;
      group.add(tentacle);
    }

    addCuteEyes(group, leftEyeRef, rightEyeRef, mood, 0.32, 0.15, 0.85);
  }
}

function addCuteEyes(
  group: THREE.Group,
  leftEyeRef: React.MutableRefObject<THREE.Group | null>,
  rightEyeRef: React.MutableRefObject<THREE.Group | null>,
  mood: PetMood,
  spread = 0.35,
  height = 0.2,
  depth = 0.85
) {
  const createEye = (isLeft: boolean) => {
    const eyeGroup = new THREE.Group();
    const eyeWhiteGeo = new THREE.SphereGeometry(0.2, 20, 20);
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const eyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    eyeWhite.scale.set(1, 1, 0.5);
    eyeGroup.add(eyeWhite);

    const pupilGeo = new THREE.SphereGeometry(0.1, 16, 16);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.position.set(0, 0, 0.08);
    eyeGroup.add(pupil);

    const glintGeo = new THREE.SphereGeometry(0.04, 12, 12);
    const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const glint = new THREE.Mesh(glintGeo, glintMat);
    glint.position.set(0.03, 0.03, 0.16);
    eyeGroup.add(glint);

    eyeGroup.position.set(isLeft ? -spread : spread, height, depth);
    return eyeGroup;
  };

  const left = createEye(true);
  const right = createEye(false);
  leftEyeRef.current = left;
  rightEyeRef.current = right;
  group.add(left);
  group.add(right);
}

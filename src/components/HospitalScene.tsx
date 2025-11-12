import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { soundManager } from '@/utils/soundManager';

interface GameState {
  health: number;
  battery: number;
  flashlightOn: boolean;
  itemsCollected: number;
  soundEnabled: boolean;
}

export const HospitalScene = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    health: 100,
    battery: 100,
    flashlightOn: true,
    itemsCollected: 0,
    soundEnabled: false,
  });

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const playerRef = useRef({ x: 0, y: 1.6, z: 8, rotationY: Math.PI, rotationX: 0 });
  const velocityRef = useRef({ x: 0, z: 0 });
  const flashlightRef = useRef<THREE.SpotLight | null>(null);
  const itemsRef = useRef<THREE.Mesh[]>([]);
  const lastFootstepTime = useRef(0);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a0f, 0.06);
    scene.background = new THREE.Color(0x050508);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(playerRef.current.x, playerRef.current.y, playerRef.current.z);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.4;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0x1a1a2e, 0.08);
    scene.add(ambientLight);

    const flashlight = new THREE.SpotLight(0xffe8c0, 3, 25, Math.PI / 5, 0.4, 2);
    flashlight.position.set(0, 0, 0);
    flashlight.castShadow = true;
    flashlight.shadow.mapSize.width = 2048;
    flashlight.shadow.mapSize.height = 2048;
    scene.add(flashlight);
    scene.add(flashlight.target);
    flashlightRef.current = flashlight;

    const moonLight = new THREE.DirectionalLight(0x6688aa, 0.03);
    moonLight.position.set(10, 15, 10);
    scene.add(moonLight);

    const floorGeometry = new THREE.PlaneGeometry(25, 50, 80, 160);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a4a3e,
      roughness: 0.98,
      metalness: 0.02,
    });
    
    const floorVertices = floorGeometry.attributes.position.array as Float32Array;
    for (let i = 0; i < floorVertices.length; i += 3) {
      floorVertices[i + 2] += (Math.random() - 0.5) * 0.08;
    }
    floorGeometry.attributes.position.needsUpdate = true;
    floorGeometry.computeVertexNormals();

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    const ceilingGeometry = new THREE.PlaneGeometry(25, 50, 40, 80);
    const ceilingMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a3a2e,
      roughness: 0.95,
      metalness: 0.05,
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 3.5;
    ceiling.receiveShadow = true;
    scene.add(ceiling);

    const createWall = (width: number, height: number, x: number, z: number, rotY: number, isDoor = false) => {
      if (isDoor) {
        const doorWidth = 1.2;
        const doorHeight = 2.5;
        const wallLeft = createWallMesh((width - doorWidth) / 2, height, 0, 0, 0);
        wallLeft.position.set(x - (doorWidth + (width - doorWidth) / 2) / 2, height / 2, z);
        wallLeft.rotation.y = rotY;
        scene.add(wallLeft);

        const wallRight = createWallMesh((width - doorWidth) / 2, height, 0, 0, 0);
        wallRight.position.set(x + (doorWidth + (width - doorWidth) / 2) / 2, height / 2, z);
        wallRight.rotation.y = rotY;
        scene.add(wallRight);

        const wallTop = createWallMesh(doorWidth, height - doorHeight, 0, 0, 0);
        wallTop.position.set(x, height / 2 + doorHeight, z);
        wallTop.rotation.y = rotY;
        scene.add(wallTop);

        const doorFrameGeo = new THREE.BoxGeometry(doorWidth + 0.2, doorHeight + 0.2, 0.15);
        const doorFrameMat = new THREE.MeshStandardMaterial({
          color: 0x1a1a1a,
          roughness: 0.7,
          metalness: 0.3,
        });
        const doorFrame = new THREE.Mesh(doorFrameGeo, doorFrameMat);
        doorFrame.position.set(x, doorHeight / 2, z);
        doorFrame.rotation.y = rotY;
        doorFrame.castShadow = true;
        scene.add(doorFrame);
      } else {
        const wall = createWallMesh(width, height, 0, 0, 0);
        wall.position.set(x, height / 2, z);
        wall.rotation.y = rotY;
        scene.add(wall);
      }
    };

    const createWallMesh = (width: number, height: number, x: number, y: number, z: number) => {
      const wallGeometry = new THREE.BoxGeometry(width, height, 0.25, Math.ceil(width * 2), Math.ceil(height * 2), 1);
      
      const wallVertices = wallGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < wallVertices.length; i += 3) {
        wallVertices[i] += (Math.random() - 0.5) * 0.03;
        wallVertices[i + 1] += (Math.random() - 0.5) * 0.03;
      }
      wallGeometry.attributes.position.needsUpdate = true;
      wallGeometry.computeVertexNormals();

      const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x556655,
        roughness: 0.92,
        metalness: 0.08,
      });
      
      const wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.set(x, y, z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      return wall;
    };

    createWall(0.25, 3.5, 10, 0, 0);
    createWall(0.25, 3.5, -10, 0, 0);
    createWall(25, 3.5, 0, -25, Math.PI / 2);
    createWall(15, 3.5, 0, 15, Math.PI / 2, true);

    for (let i = 0; i < 6; i++) {
      const windowGeo = new THREE.BoxGeometry(2, 1.5, 0.1);
      const windowMat = new THREE.MeshStandardMaterial({
        color: 0x222244,
        emissive: 0x0a0a1a,
        emissiveIntensity: 0.1,
        roughness: 0.1,
        metalness: 0.9,
        transparent: true,
        opacity: 0.6,
      });
      const window1 = new THREE.Mesh(windowGeo, windowMat);
      window1.position.set(9.9, 2, -20 + i * 6);
      scene.add(window1);

      const window2 = new THREE.Mesh(windowGeo, windowMat);
      window2.position.set(-9.9, 2, -20 + i * 6);
      scene.add(window2);
    }

    const createHospitalBed = (x: number, z: number, rotation: number) => {
      const bedFrame = new THREE.BoxGeometry(1, 0.1, 2);
      const frameMat = new THREE.MeshStandardMaterial({
        color: 0x888888,
        roughness: 0.6,
        metalness: 0.7,
      });
      const frame = new THREE.Mesh(bedFrame, frameMat);
      frame.position.set(x, 0.5, z);
      frame.rotation.y = rotation;
      frame.castShadow = true;
      frame.receiveShadow = true;
      scene.add(frame);

      const mattressGeo = new THREE.BoxGeometry(0.9, 0.2, 1.8);
      const mattressMat = new THREE.MeshStandardMaterial({
        color: 0x556666,
        roughness: 0.85,
        metalness: 0.05,
      });
      const mattress = new THREE.Mesh(mattressGeo, mattressMat);
      mattress.position.set(x, 0.65, z);
      mattress.rotation.y = rotation;
      mattress.castShadow = true;
      mattress.receiveShadow = true;
      scene.add(mattress);

      for (let i = 0; i < 4; i++) {
        const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8);
        const leg = new THREE.Mesh(legGeo, frameMat);
        const offsetX = i < 2 ? -0.4 : 0.4;
        const offsetZ = i % 2 === 0 ? -0.8 : 0.8;
        leg.position.set(
          x + offsetX * Math.cos(rotation) - offsetZ * Math.sin(rotation),
          0.25,
          z + offsetX * Math.sin(rotation) + offsetZ * Math.cos(rotation)
        );
        leg.castShadow = true;
        scene.add(leg);
      }
    };

    createHospitalBed(7, -5, Math.PI / 2);
    createHospitalBed(-7, -5, -Math.PI / 2);
    createHospitalBed(7, -12, Math.PI / 2);
    createHospitalBed(-7, -12, -Math.PI / 2);
    createHospitalBed(7, -19, Math.PI / 2);
    createHospitalBed(-7, -19, -Math.PI / 2);

    const createMedicalCabinet = (x: number, z: number, rotation: number) => {
      const cabinetGeo = new THREE.BoxGeometry(0.8, 1.6, 0.4);
      const cabinetMat = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        roughness: 0.7,
        metalness: 0.3,
      });
      const cabinet = new THREE.Mesh(cabinetGeo, cabinetMat);
      cabinet.position.set(x, 0.8, z);
      cabinet.rotation.y = rotation;
      cabinet.castShadow = true;
      cabinet.receiveShadow = true;
      scene.add(cabinet);
    };

    createMedicalCabinet(9.5, -8, -Math.PI / 2);
    createMedicalCabinet(-9.5, -15, Math.PI / 2);

    const createItem = (x: number, z: number, type: 'battery' | 'health') => {
      const geometry = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 16);
      const material = new THREE.MeshStandardMaterial({
        color: type === 'battery' ? 0x4488ff : 0xff4444,
        emissive: type === 'battery' ? 0x2244aa : 0xaa2222,
        emissiveIntensity: 0.6,
        roughness: 0.2,
        metalness: 0.8,
      });
      const item = new THREE.Mesh(geometry, material);
      item.position.set(x, 0.15, z);
      item.castShadow = true;
      item.userData = { type, collected: false };
      scene.add(item);
      itemsRef.current.push(item);

      const glowGeometry = new THREE.SphereGeometry(0.4, 16, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: type === 'battery' ? 0x6699ff : 0xff6666,
        transparent: true,
        opacity: 0.15,
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.copy(item.position);
      scene.add(glow);
      item.userData.glow = glow;

      const lightColor = type === 'battery' ? 0x4488ff : 0xff4444;
      const pointLight = new THREE.PointLight(lightColor, 0.5, 5);
      pointLight.position.copy(item.position);
      scene.add(pointLight);
      item.userData.light = pointLight;
    };

    createItem(-5, -3, 'battery');
    createItem(6, -10, 'health');
    createItem(-4, -17, 'battery');
    createItem(3, -22, 'health');

    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 500;
    const positions = new Float32Array(particlesCount * 3);
    
    for (let i = 0; i < particlesCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 25;
      positions[i + 1] = Math.random() * 3.5;
      positions[i + 2] = Math.random() * -50;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      color: 0xaaaaaa,
      size: 0.03,
      transparent: true,
      opacity: 0.4,
    });
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    let lastTime = Date.now();
    let batteryDrainTime = 0;

    const animate = () => {
      const currentTime = Date.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const moveSpeed = 3.5;
      const newX = playerRef.current.x + velocityRef.current.x * moveSpeed * deltaTime;
      const newZ = playerRef.current.z + velocityRef.current.z * moveSpeed * deltaTime;

      if (Math.abs(newX) < 9.5) playerRef.current.x = newX;
      if (newZ > -24 && newZ < 14) playerRef.current.z = newZ;

      const isMoving = velocityRef.current.x !== 0 || velocityRef.current.z !== 0;
      if (isMoving && gameState.soundEnabled && currentTime - lastFootstepTime.current > 500) {
        soundManager.playSound('footstep', 0.3);
        lastFootstepTime.current = currentTime;
      }

      camera.position.set(playerRef.current.x, playerRef.current.y, playerRef.current.z);
      camera.rotation.y = playerRef.current.rotationY;
      camera.rotation.x = playerRef.current.rotationX;

      const lookDirection = new THREE.Vector3(
        Math.sin(playerRef.current.rotationY),
        Math.tan(playerRef.current.rotationX),
        Math.cos(playerRef.current.rotationY)
      );
      
      flashlight.position.copy(camera.position);
      flashlight.target.position.copy(camera.position).add(lookDirection);
      
      if (gameState.flashlightOn && gameState.battery > 0) {
        flashlight.intensity = 3 * (gameState.battery / 100);
        batteryDrainTime += deltaTime;
        if (batteryDrainTime > 0.1) {
          setGameState(prev => ({
            ...prev,
            battery: Math.max(0, prev.battery - 0.25),
          }));
          batteryDrainTime = 0;
        }
      } else {
        flashlight.intensity = 0;
      }

      itemsRef.current.forEach((item) => {
        if (!item.userData.collected) {
          const dx = item.position.x - playerRef.current.x;
          const dz = item.position.z - playerRef.current.z;
          const distance = Math.sqrt(dx * dx + dz * dz);

          item.rotation.y += deltaTime * 2;
          item.position.y = 0.15 + Math.sin(Date.now() * 0.003) * 0.08;

          if (item.userData.glow) {
            item.userData.glow.position.copy(item.position);
            item.userData.glow.scale.setScalar(1 + Math.sin(Date.now() * 0.004) * 0.25);
          }

          if (item.userData.light) {
            item.userData.light.position.copy(item.position);
            item.userData.light.intensity = 0.5 + Math.sin(Date.now() * 0.005) * 0.2;
          }

          if (distance < 1.2) {
            item.userData.collected = true;
            scene.remove(item);
            if (item.userData.glow) scene.remove(item.userData.glow);
            if (item.userData.light) scene.remove(item.userData.light);

            if (gameState.soundEnabled) {
              soundManager.playSound('pickup', 0.8);
            }

            setGameState(prev => ({
              ...prev,
              battery: item.userData.type === 'battery' 
                ? Math.min(100, prev.battery + 35)
                : prev.battery,
              health: item.userData.type === 'health'
                ? Math.min(100, prev.health + 30)
                : prev.health,
              itemsCollected: prev.itemsCollected + 1,
            }));
          }
        }
      });

      const particlePositions = particles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particlePositions.length; i += 3) {
        particlePositions[i + 1] -= deltaTime * 0.2;
        if (particlePositions[i + 1] < 0) {
          particlePositions[i + 1] = 3.5;
        }
      }
      particles.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      soundManager.stopAll();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [gameState.flashlightOn, gameState.battery, gameState.soundEnabled]);

  useEffect(() => {
    if (gameState.soundEnabled) {
      soundManager.init().then(() => {
        soundManager.startAmbient();
      });

      heartbeatInterval.current = setInterval(() => {
        if (gameState.health < 40) {
          soundManager.playHeartbeat(gameState.health);
        }
      }, 1500);
    }

    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
    };
  }, [gameState.soundEnabled, gameState.health]);

  const toggleFlashlight = () => {
    if (gameState.soundEnabled) {
      soundManager.playSound('flashlight', 0.5);
    }
    setGameState(prev => ({ ...prev, flashlightOn: !prev.flashlightOn }));
  };

  const enableSound = async () => {
    await soundManager.init();
    soundManager.startAmbient();
    setGameState(prev => ({ ...prev, soundEnabled: true }));
  };

  return {
    containerRef,
    gameState,
    toggleFlashlight,
    enableSound,
    playerRef,
    velocityRef,
  };
};

export default HospitalScene;

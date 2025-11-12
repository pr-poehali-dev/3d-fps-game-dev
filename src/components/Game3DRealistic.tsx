import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface GameState {
  health: number;
  battery: number;
  flashlightOn: boolean;
  itemsCollected: number;
}

export const Game3DRealistic = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    health: 100,
    battery: 100,
    flashlightOn: true,
    itemsCollected: 0,
  });

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const playerRef = useRef({ x: 0, y: 1.6, z: 5, rotationY: 0, rotationX: 0 });
  const velocityRef = useRef({ x: 0, z: 0 });
  const flashlightRef = useRef<THREE.SpotLight | null>(null);
  const itemsRef = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.08);
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
    renderer.toneMappingExposure = 0.5;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0x1a1a2e, 0.1);
    scene.add(ambientLight);

    const flashlight = new THREE.SpotLight(0xfff4e6, 2, 20, Math.PI / 6, 0.5, 2);
    flashlight.position.set(0, 0, 0);
    flashlight.castShadow = true;
    flashlight.shadow.mapSize.width = 1024;
    flashlight.shadow.mapSize.height = 1024;
    scene.add(flashlight);
    scene.add(flashlight.target);
    flashlightRef.current = flashlight;

    const moonLight = new THREE.DirectionalLight(0x4d6b9e, 0.05);
    moonLight.position.set(5, 10, 5);
    scene.add(moonLight);

    const floorGeometry = new THREE.PlaneGeometry(20, 40, 50, 100);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2420,
      roughness: 0.95,
      metalness: 0.05,
    });
    
    const floorVertices = floorGeometry.attributes.position.array;
    for (let i = 0; i < floorVertices.length; i += 3) {
      floorVertices[i + 2] += (Math.random() - 0.5) * 0.05;
    }
    floorGeometry.attributes.position.needsUpdate = true;
    floorGeometry.computeVertexNormals();

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    const createWall = (width: number, height: number, x: number, z: number, rotY: number) => {
      const wallGeometry = new THREE.BoxGeometry(width, height, 0.3, 10, 5, 1);
      
      const wallVertices = wallGeometry.attributes.position.array;
      for (let i = 0; i < wallVertices.length; i += 3) {
        wallVertices[i] += (Math.random() - 0.5) * 0.02;
        wallVertices[i + 1] += (Math.random() - 0.5) * 0.02;
      }
      wallGeometry.attributes.position.needsUpdate = true;
      wallGeometry.computeVertexNormals();

      const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x3d3328,
        roughness: 0.9,
        metalness: 0.1,
      });
      
      const wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.set(x, height / 2, z);
      wall.rotation.y = rotY;
      wall.castShadow = true;
      wall.receiveShadow = true;
      scene.add(wall);
    };

    createWall(0.3, 4, 8, -5, 0);
    createWall(0.3, 4, -8, -5, 0);
    createWall(20, 4, 0, -20, Math.PI / 2);
    createWall(20, 4, 0, 10, Math.PI / 2);

    for (let i = 0; i < 8; i++) {
      const pillarGeometry = new THREE.CylinderGeometry(0.3, 0.35, 4, 8);
      const pillarMaterial = new THREE.MeshStandardMaterial({
        color: 0x2d2419,
        roughness: 0.8,
        metalness: 0.2,
      });
      const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.position.set(
        (Math.random() - 0.5) * 14,
        2,
        -3 - i * 2.5 + Math.random() * 2
      );
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      scene.add(pillar);
    }

    const createItem = (x: number, z: number, type: 'battery' | 'health') => {
      const geometry = new THREE.BoxGeometry(0.3, 0.4, 0.2);
      const material = new THREE.MeshStandardMaterial({
        color: type === 'battery' ? 0x4488ff : 0xff4444,
        emissive: type === 'battery' ? 0x2244aa : 0xaa2222,
        emissiveIntensity: 0.5,
        roughness: 0.3,
        metalness: 0.7,
      });
      const item = new THREE.Mesh(geometry, material);
      item.position.set(x, 0.2, z);
      item.castShadow = true;
      item.userData = { type, collected: false };
      scene.add(item);
      itemsRef.current.push(item);

      const glowGeometry = new THREE.SphereGeometry(0.3, 16, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: type === 'battery' ? 0x6699ff : 0xff6666,
        transparent: true,
        opacity: 0.2,
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.copy(item.position);
      scene.add(glow);
      item.userData.glow = glow;
    };

    createItem(-4, -5, 'battery');
    createItem(5, -10, 'health');
    createItem(-3, -15, 'battery');
    createItem(2, -18, 'health');

    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 300;
    const positions = new Float32Array(particlesCount * 3);
    
    for (let i = 0; i < particlesCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 20;
      positions[i + 1] = Math.random() * 4;
      positions[i + 2] = Math.random() * -40;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      color: 0x888888,
      size: 0.02,
      transparent: true,
      opacity: 0.3,
    });
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    let lastTime = Date.now();
    let batteryDrainTime = 0;

    const animate = () => {
      const currentTime = Date.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const moveSpeed = 3;
      const newX = playerRef.current.x + velocityRef.current.x * moveSpeed * deltaTime;
      const newZ = playerRef.current.z + velocityRef.current.z * moveSpeed * deltaTime;

      if (Math.abs(newX) < 7.5) playerRef.current.x = newX;
      if (newZ > -19 && newZ < 9) playerRef.current.z = newZ;

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
        flashlight.intensity = 2 * (gameState.battery / 100);
        batteryDrainTime += deltaTime;
        if (batteryDrainTime > 0.1) {
          setGameState(prev => ({
            ...prev,
            battery: Math.max(0, prev.battery - 0.3),
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

          item.rotation.y += deltaTime;
          item.position.y = 0.2 + Math.sin(Date.now() * 0.002) * 0.1;

          if (item.userData.glow) {
            item.userData.glow.position.copy(item.position);
            item.userData.glow.scale.setScalar(1 + Math.sin(Date.now() * 0.003) * 0.2);
          }

          if (distance < 1) {
            item.userData.collected = true;
            scene.remove(item);
            if (item.userData.glow) scene.remove(item.userData.glow);

            setGameState(prev => ({
              ...prev,
              battery: item.userData.type === 'battery' 
                ? Math.min(100, prev.battery + 30)
                : prev.battery,
              health: item.userData.type === 'health'
                ? Math.min(100, prev.health + 25)
                : prev.health,
              itemsCollected: prev.itemsCollected + 1,
            }));
          }
        }
      });

      const particlePositions = particles.geometry.attributes.position.array;
      for (let i = 0; i < particlePositions.length; i += 3) {
        particlePositions[i + 1] -= deltaTime * 0.3;
        if (particlePositions[i + 1] < 0) {
          particlePositions[i + 1] = 4;
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
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [gameState.flashlightOn, gameState.battery]);

  const toggleFlashlight = () => {
    setGameState(prev => ({ ...prev, flashlightOn: !prev.flashlightOn }));
  };

  return {
    containerRef,
    gameState,
    toggleFlashlight,
    playerRef,
    velocityRef,
  };
};

export default Game3DRealistic;

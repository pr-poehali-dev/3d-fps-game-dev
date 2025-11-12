import { useEffect, useRef, useState } from 'react';

interface Vector3 {
  x: number;
  y: number;
  z: number;
}

interface Item {
  position: Vector3;
  type: 'battery' | 'health';
  collected: boolean;
}

export const Game3D = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playerPos, setPlayerPos] = useState<Vector3>({ x: 0, y: 0, z: 5 });
  const [playerAngle, setPlayerAngle] = useState({ yaw: 0, pitch: 0 });
  const [health, setHealth] = useState(100);
  const [battery, setBattery] = useState(100);
  const [flashlightOn, setFlashlightOn] = useState(true);
  const [items, setItems] = useState<Item[]>([
    { position: { x: -3, y: 0, z: -5 }, type: 'battery', collected: false },
    { position: { x: 4, y: 0, z: -8 }, type: 'health', collected: false },
    { position: { x: -2, y: 0, z: -12 }, type: 'battery', collected: false },
    { position: { x: 1, y: 0, z: -15 }, type: 'health', collected: false },
  ]);

  const velocityRef = useRef({ x: 0, z: 0 });
  const touchStartRef = useRef({ x: 0, y: 0 });
  const lastFrameTime = useRef(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let animationId: number;

    const render = () => {
      const now = Date.now();
      const deltaTime = (now - lastFrameTime.current) / 1000;
      lastFrameTime.current = now;

      if (!ctx || !canvas) return;

      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const halfWidth = canvas.width / 2;
      const halfHeight = canvas.height / 2;
      const fov = Math.PI / 3;
      const rayCount = 120;

      for (let i = 0; i < rayCount; i++) {
        const rayAngle = playerAngle.yaw - fov / 2 + (fov * i) / rayCount;
        
        const rayDirX = Math.sin(rayAngle);
        const rayDirZ = Math.cos(rayAngle);

        let hitDist = 20;
        let wallType = 0;

        for (let dist = 0; dist < 20; dist += 0.1) {
          const testX = playerPos.x + rayDirX * dist;
          const testZ = playerPos.z + rayDirZ * dist;

          if (Math.abs(testX) > 8) {
            hitDist = dist;
            wallType = 1;
            break;
          }

          if (testZ < -20 || testZ > 10) {
            hitDist = dist;
            wallType = 2;
            break;
          }
        }

        const perpDist = hitDist * Math.cos(rayAngle - playerAngle.yaw);
        const wallHeight = (canvas.height / perpDist) * 2;

        const brightness = Math.max(0, 1 - perpDist / 15);
        const lightIntensity = flashlightOn ? brightness * (battery / 100) : brightness * 0.1;

        let r = 20, g = 20, b = 25;
        
        if (wallType === 1) {
          r = 30; g = 25; b = 20;
        } else if (wallType === 2) {
          r = 25; g = 20; b = 30;
        }

        r = Math.floor(r * lightIntensity);
        g = Math.floor(g * lightIntensity);
        b = Math.floor(b * lightIntensity);

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(
          (i / rayCount) * canvas.width,
          halfHeight - wallHeight / 2,
          canvas.width / rayCount + 1,
          wallHeight
        );
      }

      ctx.fillStyle = '#0f0f14';
      ctx.fillRect(0, 0, canvas.width, halfHeight - canvas.height / 4);
      
      ctx.fillStyle = '#08080c';
      ctx.fillRect(0, halfHeight + canvas.height / 4, canvas.width, canvas.height);

      items.forEach(item => {
        if (item.collected) return;

        const dx = item.position.x - playerPos.x;
        const dz = item.position.z - playerPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < 1) {
          setItems(prev => prev.map(i => 
            i === item ? { ...i, collected: true } : i
          ));
          
          if (item.type === 'battery') {
            setBattery(prev => Math.min(100, prev + 30));
          } else {
            setHealth(prev => Math.min(100, prev + 25));
          }
          return;
        }

        const angle = Math.atan2(dx, dz);
        const angleDiff = angle - playerAngle.yaw;

        if (Math.abs(angleDiff) < Math.PI / 3) {
          const screenX = halfWidth + Math.tan(angleDiff) * halfWidth * 1.5;
          const size = (30 / dist) * (flashlightOn ? battery / 100 : 0.3);

          if (screenX > 0 && screenX < canvas.width) {
            const brightness = Math.max(0.2, 1 - dist / 10);
            ctx.fillStyle = item.type === 'battery' 
              ? `rgba(100, 200, 255, ${brightness})`
              : `rgba(255, 100, 100, ${brightness})`;
            
            ctx.beginPath();
            ctx.arc(screenX, halfHeight, size, 0, Math.PI * 2);
            ctx.fill();

            if (dist < 5) {
              ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.8})`;
              ctx.font = '14px Roboto';
              ctx.textAlign = 'center';
              ctx.fillText(
                item.type === 'battery' ? 'Батарея' : 'Аптечка',
                screenX,
                halfHeight - size - 10
              );
            }
          }
        }
      });

      const moveSpeed = 3;
      const newX = playerPos.x + velocityRef.current.x * moveSpeed * deltaTime;
      const newZ = playerPos.z + velocityRef.current.z * moveSpeed * deltaTime;

      if (Math.abs(newX) < 7.5) {
        setPlayerPos(prev => ({ ...prev, x: newX }));
      }
      if (newZ > -19.5 && newZ < 9.5) {
        setPlayerPos(prev => ({ ...prev, z: newZ }));
      }

      if (flashlightOn && battery > 0) {
        setBattery(prev => Math.max(0, prev - deltaTime * 2));
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [playerPos, playerAngle, flashlightOn, battery, items]);

  return { 
    canvasRef, 
    health, 
    battery, 
    flashlightOn,
    setFlashlightOn,
    setPlayerAngle,
    velocityRef,
    touchStartRef
  };
};

export default Game3D;

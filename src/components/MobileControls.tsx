import { useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';

interface MobileControlsProps {
  velocityRef: React.MutableRefObject<{ x: number; z: number }>;
  playerRef: React.MutableRefObject<{ x: number; y: number; z: number; rotationY: number; rotationX: number }>;
  onFlashlightToggle: () => void;
  flashlightOn: boolean;
}

export const MobileControls = ({ 
  velocityRef, 
  playerRef,
  onFlashlightToggle,
  flashlightOn 
}: MobileControlsProps) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const joystickHandleRef = useRef<HTMLDivElement>(null);
  const lookAreaRef = useRef<HTMLDivElement>(null);
  
  const joystickActive = useRef(false);
  const joystickStartPos = useRef({ x: 0, y: 0 });
  const lastTouchPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleJoystickStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      joystickActive.current = true;
      joystickStartPos.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleJoystickMove = (e: TouchEvent) => {
      if (!joystickActive.current || !joystickHandleRef.current) return;
      e.preventDefault();

      const touch = e.touches[0];
      const dx = touch.clientX - joystickStartPos.current.x;
      const dy = touch.clientY - joystickStartPos.current.y;

      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = 50;
      const clampedDistance = Math.min(distance, maxDistance);
      const angle = Math.atan2(dy, dx);

      const handleX = Math.cos(angle) * clampedDistance;
      const handleY = Math.sin(angle) * clampedDistance;

      joystickHandleRef.current.style.transform = `translate(${handleX}px, ${handleY}px)`;

      const forwardBack = -dy / maxDistance;
      const leftRight = dx / maxDistance;

      const rotationY = playerRef.current.rotationY;
      velocityRef.current.x = leftRight * Math.cos(rotationY) + forwardBack * Math.sin(rotationY);
      velocityRef.current.z = leftRight * Math.sin(rotationY) - forwardBack * Math.cos(rotationY);
    };

    const handleJoystickEnd = () => {
      joystickActive.current = false;
      velocityRef.current = { x: 0, z: 0 };
      if (joystickHandleRef.current) {
        joystickHandleRef.current.style.transform = 'translate(0, 0)';
      }
    };

    const handleLookStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      lastTouchPos.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleLookMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const dx = touch.clientX - lastTouchPos.current.x;
      const dy = touch.clientY - lastTouchPos.current.y;

      playerRef.current.rotationY -= dx * 0.003;
      playerRef.current.rotationX = Math.max(
        -Math.PI / 3,
        Math.min(Math.PI / 3, playerRef.current.rotationX - dy * 0.003)
      );

      lastTouchPos.current = { x: touch.clientX, y: touch.clientY };
    };

    const joystick = joystickRef.current;
    const lookArea = lookAreaRef.current;

    if (joystick) {
      joystick.addEventListener('touchstart', handleJoystickStart, { passive: false });
      joystick.addEventListener('touchmove', handleJoystickMove, { passive: false });
      joystick.addEventListener('touchend', handleJoystickEnd);
    }

    if (lookArea) {
      lookArea.addEventListener('touchstart', handleLookStart, { passive: false });
      lookArea.addEventListener('touchmove', handleLookMove, { passive: false });
    }

    return () => {
      if (joystick) {
        joystick.removeEventListener('touchstart', handleJoystickStart);
        joystick.removeEventListener('touchmove', handleJoystickMove);
        joystick.removeEventListener('touchend', handleJoystickEnd);
      }
      if (lookArea) {
        lookArea.removeEventListener('touchstart', handleLookStart);
        lookArea.removeEventListener('touchmove', handleLookMove);
      }
    };
  }, [velocityRef, playerRef]);

  return (
    <>
      <div 
        ref={lookAreaRef}
        className="absolute inset-0 touch-none"
        style={{ zIndex: 1 }}
      />

      <div className="absolute bottom-8 left-8 z-10">
        <div
          ref={joystickRef}
          className="relative w-32 h-32 bg-white/10 rounded-full border-2 border-white/20 backdrop-blur-sm"
        >
          <div
            ref={joystickHandleRef}
            className="absolute top-1/2 left-1/2 w-12 h-12 bg-white/30 rounded-full border-2 border-white/40 -translate-x-1/2 -translate-y-1/2 transition-transform"
          />
        </div>
        <div className="text-white/60 text-xs text-center mt-2 font-['Roboto']">
          Движение
        </div>
      </div>

      <div className="absolute bottom-8 right-8 z-10 flex flex-col gap-4">
        <button
          onClick={onFlashlightToggle}
          className={`w-16 h-16 rounded-full backdrop-blur-sm border-2 flex items-center justify-center transition-all ${
            flashlightOn 
              ? 'bg-primary/30 border-primary/60' 
              : 'bg-white/10 border-white/20'
          }`}
        >
          <Icon 
            name={flashlightOn ? 'Lightbulb' : 'LightbulbOff'} 
            size={28} 
            className="text-white"
          />
        </button>
        <div className="text-white/60 text-xs text-center font-['Roboto']">
          Фонарик
        </div>
      </div>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm text-center font-['Roboto'] z-10">
        Смахивайте по экрану для обзора
      </div>
    </>
  );
};

export default MobileControls;

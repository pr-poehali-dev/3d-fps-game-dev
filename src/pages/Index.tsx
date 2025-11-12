import { Game3DRealistic } from '@/components/Game3DRealistic';
import { MobileControls } from '@/components/MobileControls';
import { GameUI } from '@/components/GameUI';

const Index = () => {
  const { 
    containerRef, 
    gameState, 
    toggleFlashlight, 
    playerRef, 
    velocityRef 
  } = Game3DRealistic();

  return (
    <div className="w-screen h-screen overflow-hidden bg-black horror-vignette horror-grain relative">
      <div ref={containerRef} className="w-full h-full" />
      
      <GameUI 
        health={gameState.health}
        battery={gameState.battery}
        itemsCollected={gameState.itemsCollected}
      />
      
      <MobileControls
        velocityRef={velocityRef}
        playerRef={playerRef}
        onFlashlightToggle={toggleFlashlight}
        flashlightOn={gameState.flashlightOn}
      />

      {gameState.battery === 0 && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="text-center">
            <h2 className="text-red-500 text-4xl font-['Oswald'] mb-4">
              Батарея разряжена
            </h2>
            <p className="text-white/70 font-['Roboto']">
              Найдите батарею, чтобы продолжить
            </p>
          </div>
        </div>
      )}

      {gameState.itemsCollected === 4 && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="text-center">
            <h2 className="text-green-500 text-5xl font-['Oswald'] mb-4 animate-fade-in">
              Вы выжили!
            </h2>
            <p className="text-white/90 text-xl font-['Roboto'] mb-6">
              Все предметы собраны
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-primary hover:bg-primary/80 text-white font-['Oswald'] text-lg rounded-lg transition-all"
            >
              Играть снова
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
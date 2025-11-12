import { HospitalScene } from '@/components/HospitalScene';
import { MobileControls } from '@/components/MobileControls';
import { GameUI } from '@/components/GameUI';

const Index = () => {
  const { 
    containerRef, 
    gameState, 
    toggleFlashlight,
    enableSound,
    playerRef, 
    velocityRef 
  } = HospitalScene();

  return (
    <div className="w-screen h-screen overflow-hidden bg-black horror-vignette horror-grain relative">
      {!gameState.soundEnabled && (
        <div className="absolute inset-0 bg-black/95 flex items-center justify-center z-50">
          <div className="text-center">
            <h2 className="text-white text-5xl font-['Oswald'] mb-6">
              Заброшенная больница
            </h2>
            <p className="text-white/70 text-lg font-['Roboto'] mb-8 max-w-md mx-auto">
              Вы очнулись в темном коридоре старой больницы.
              Найдите выход и соберите все предметы, чтобы выжить.
            </p>
            <button
              onClick={enableSound}
              className="px-12 py-4 bg-primary hover:bg-primary/80 text-white font-['Oswald'] text-xl rounded-lg transition-all shadow-lg hover:shadow-xl"
            >
              Начать игру
            </button>
            <p className="text-white/50 text-sm font-['Roboto'] mt-6">
              🎧 Рекомендуем играть со звуком
            </p>
          </div>
        </div>
      )}
      
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

      {gameState.battery === 0 && gameState.soundEnabled && (
        <div className="absolute inset-0 bg-black/95 flex items-center justify-center z-50">
          <div className="text-center">
            <h2 className="text-red-500 text-5xl font-['Oswald'] mb-4 animate-fade-in">
              Батарея разряжена
            </h2>
            <p className="text-white/70 text-xl font-['Roboto'] mb-8">
              Вы погрузились во тьму...
            </p>
            <p className="text-white/50 font-['Roboto']">
              Найдите батарею в темноте
            </p>
          </div>
        </div>
      )}

      {gameState.itemsCollected === 4 && gameState.soundEnabled && (
        <div className="absolute inset-0 bg-black/95 flex items-center justify-center z-50">
          <div className="text-center">
            <h2 className="text-green-500 text-6xl font-['Oswald'] mb-6 animate-fade-in">
              Вы выжили!
            </h2>
            <p className="text-white/90 text-2xl font-['Roboto'] mb-4">
              Вы нашли все предметы и выбрались из больницы
            </p>
            <p className="text-white/60 text-lg font-['Roboto'] mb-8">
              Предметов собрано: {gameState.itemsCollected}/4
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-12 py-4 bg-primary hover:bg-primary/80 text-white font-['Oswald'] text-xl rounded-lg transition-all shadow-lg hover:shadow-xl"
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
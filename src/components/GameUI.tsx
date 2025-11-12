import Icon from '@/components/ui/icon';

interface GameUIProps {
  health: number;
  battery: number;
  itemsCollected: number;
}

export const GameUI = ({ health, battery, itemsCollected }: GameUIProps) => {
  return (
    <div className="absolute top-8 left-8 z-10 space-y-4">
      <div className="bg-black/60 backdrop-blur-md rounded-lg p-4 border border-white/10 min-w-[200px]">
        <div className="flex items-center gap-3 mb-3">
          <Icon name="Heart" size={20} className="text-red-500" />
          <span className="text-white font-['Oswald'] text-lg">Здоровье</span>
        </div>
        <div className="h-3 bg-black/50 rounded-full overflow-hidden border border-white/10">
          <div 
            className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300"
            style={{ width: `${health}%` }}
          />
        </div>
        <div className="text-white/70 text-sm mt-1 font-['Roboto']">{health}%</div>
      </div>

      <div className="bg-black/60 backdrop-blur-md rounded-lg p-4 border border-white/10 min-w-[200px]">
        <div className="flex items-center gap-3 mb-3">
          <Icon name="Battery" size={20} className="text-blue-400" />
          <span className="text-white font-['Oswald'] text-lg">Батарея</span>
        </div>
        <div className="h-3 bg-black/50 rounded-full overflow-hidden border border-white/10">
          <div 
            className={`h-full transition-all duration-300 ${
              battery > 30 
                ? 'bg-gradient-to-r from-blue-600 to-blue-400'
                : 'bg-gradient-to-r from-orange-600 to-red-500 animate-pulse'
            }`}
            style={{ width: `${battery}%` }}
          />
        </div>
        <div className="text-white/70 text-sm mt-1 font-['Roboto']">{battery.toFixed(0)}%</div>
        {battery < 20 && (
          <div className="text-red-400 text-xs mt-2 animate-pulse font-['Roboto']">
            ⚠️ Батарея разряжена!
          </div>
        )}
      </div>

      <div className="bg-black/60 backdrop-blur-md rounded-lg p-4 border border-white/10 min-w-[200px]">
        <div className="flex items-center gap-3">
          <Icon name="Package" size={20} className="text-green-400" />
          <span className="text-white font-['Oswald'] text-lg">Предметы</span>
        </div>
        <div className="text-white/90 text-2xl mt-2 font-['Roboto'] font-bold">
          {itemsCollected} / 4
        </div>
      </div>
    </div>
  );
};

export default GameUI;

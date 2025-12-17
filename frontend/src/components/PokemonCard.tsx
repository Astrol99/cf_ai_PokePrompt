import { Card } from "@/components/ui/pixelact-ui/card";
import { cn } from "@/lib/utils";

export interface CardData {
  name: string;
  hp: string | number;
  type: string;
  description: string;
  creatureType?: string;
  moves: Array<{
    name: string;
    damage: string;
    cost: string[];
    description: string;
  }>;
  weakness?: { type: string; value: string };
  resistance?: { type: string; value: string };
  retreat?: number;
}

interface PokemonCardProps {
  data: CardData;
  imageUrl?: string;
  className?: string;
}

const TYPE_COLORS: Record<string, string> = {
  Fire: "bg-red-500",
  Water: "bg-blue-500",
  Grass: "bg-green-500",
  Electric: "bg-yellow-400",
  Psychic: "bg-purple-500",
  Fighting: "bg-orange-600",
  Darkness: "bg-gray-800 text-white",
  Metal: "bg-gray-400",
  Fairy: "bg-pink-400",
  Dragon: "bg-indigo-600 text-white",
  Colorless: "bg-gray-200",
};

export function PokemonCard({ data, imageUrl, className }: PokemonCardProps) {
  const typeColor = TYPE_COLORS[data.type] || "bg-gray-200";

  return (
    <Card className={cn("relative w-[420px] p-4 font-pixel border-4 border-black", typeColor, className)}>
      <div className="h-full w-full bg-white/90 p-3 flex flex-col gap-2 relative overflow-hidden border-2 border-black/10">
        
        {/* Header */}
        <div className="flex justify-between items-center px-1 gap-2">
          <h2 className="font-bold text-xl tracking-tight truncate max-w-[200px]">{data.name}</h2>
          <div className="flex items-center gap-1 font-bold text-red-600">
             <span className="text-xs text-black font-normal mr-1">HP</span>
             <span className="text-xl">{data.hp}</span>
             <span className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs border-2 border-black/20", typeColor)}>
               {data.type.slice(0, 1)}
             </span>
          </div>
        </div>

        {/* Image */}
        <div className="w-full aspect-[4/3] bg-slate-100 border-2 border-black/10 shadow-inner overflow-hidden relative shrink-0">
            {imageUrl ? (
                <img src={imageUrl} alt={data.name} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No Image</div>
            )}
        </div>

        {/* Info Bar (optional, like 'Basic Pokemon') */}
        <div className="w-full bg-gradient-to-r from-yellow-300 to-yellow-500 h-6 px-2 flex items-center justify-center text-[10px] italic font-semibold text-yellow-900 shadow-sm rounded-sm">
            {data.creatureType || "AI Generated Pocket Monster"}
        </div>

        {/* Moves */}
        <div className="flex-1 flex flex-col gap-2 py-2">
            {data.moves.map((move, i) => (
                <div key={i} className="flex flex-col gap-0.5 animate-in fade-in slide-in-from-bottom-2 duration-500 shrink-0" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="flex justify-between items-center group hover:bg-black/5 p-1 rounded transition-colors">
                        <div className="flex items-center gap-2">
                           <div className="flex gap-0.5">
                               {move.cost.map((c, idx) => (
                                   <div key={idx} className={cn("w-4 h-4 rounded-full shadow-sm border border-black/10", TYPE_COLORS[c] || "bg-gray-100")}></div>
                               ))}
                           </div>
                           <span className="font-bold text-xs ml-1">{move.name}</span>
                        </div>
                        <span className="font-bold text-xs">{move.damage}</span>
                    </div>
                    {move.description && <p className="text-[6px] text-muted-foreground leading-snug px-1">{move.description}</p>}
                </div>
            ))}
        </div>

        {/* Footer Stats */}
        <div className="mt-auto border-t pt-1 flex justify-between text-[10px] font-bold text-gray-600 px-1">
            <div className="flex flex-col items-center">
                <span>Weakness</span>
                {data.weakness ? (
                    <span className="flex items-center gap-0.5">
                          {data.weakness.type} {data.weakness.value}
                    </span>
                 ) : <span>-</span>}
            </div>
             <div className="flex flex-col items-center">
                <span>Resistance</span>
                 {data.resistance ? (
                    <span className="flex items-center gap-0.5">
                          {data.resistance.type} {data.resistance.value}
                    </span>
                 ) : <span>-</span>}
            </div>
             <div className="flex flex-col items-center">
                <span>Retreat</span>
                <span>{data.retreat ? "★".repeat(data.retreat) : "-"}</span>
            </div>
        </div>
        
         {/* Flavor Text */}
         <div className="border border-black/10 rounded overflow-hidden mt-1 bg-yellow-50/50 p-1">
             <p className="text-[9px] italic text-gray-700 leading-tight text-center font-serif">
                 {data.description}
             </p>
         </div>

      </div>
    </Card>
  );
}

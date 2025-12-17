import { useState } from 'react'
import { UploadZone } from './components/UploadZone'
import { PokemonCard, type CardData } from './components/PokemonCard'
import { Button } from '@/components/ui/pixelact-ui/button'
import { Input } from '@/components/ui/pixelact-ui/input'
import { Card } from '@/components/ui/pixelact-ui/card'
import { Loader2, Sparkles, Send } from 'lucide-react'

import { useRef, useEffect } from 'react'

const TERMINAL_LOGS = [
  "Initializing neural link...",
  "Scanning pixel matrix...",
  "Detecting creature contours...",
  "Analyzing color palette...",
  "Matching species signature...",
  "Querying regional pokedex...",
  "Calculating base stats...",
  "Assigning move set...",
  "Generating flavor text...",
  "Compiling card data...",
  "Finalizing render..."
];

function TerminalLoader() {
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < TERMINAL_LOGS.length) {
        setLogs(prev => [...prev, TERMINAL_LOGS[currentIndex]]);
        currentIndex++;
      } else {
        // Loop or stay? Let's loop for continuous effect
        setLogs([]);
        currentIndex = 0;
      }
    }, 800); // Speed of logs

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="relative w-[320px] md:w-[420px] aspect-[2.5/3.5] bg-black border-4 border-gray-800 rounded-lg flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 font-mono text-xs md:text-sm text-green-500 p-4">
        {/* CRT Scanline Effect */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_4px,3px_100%] pointer-events-none"></div>
        
        <div className="border-b border-green-500/50 pb-2 mb-2 flex justify-between items-center opacity-70">
            <span>PokéPrompt_V1.0</span>
            <span className="animate-pulse">ONLINE</span>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1 scrollbar-hide">
            {logs.map((log, i) => (
                <div key={i} className="flex gap-2 animate-in fade-in slide-in-from-left-2 md:tracking-wider">
                    <span className="opacity-50">&gt;</span>
                    <span>{log}</span>
                </div>
            ))}
            <div className="animate-pulse">_</div>
        </div>
    </div>
  );
}

function App() {
  const [image, setImage] = useState<string | null>(null);
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const handleImageSelected = async (base64: string) => {
    setImage(base64);
    setLoading(true);
    setCardData(null);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });
      if (!response.ok) throw new Error('Generation failed');
      const data = await response.json();
      setCardData(data);
    } catch (error) {
      console.error(error);
      alert("Failed to generate card. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !cardData) return;

    setChatLoading(true);
    try {
       const response = await fetch('/api/chat', {
        method: 'POST',
       headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            messages: [{ role: 'user', content: chatInput }],
            currentCard: cardData 
        }),
      });
      if (!response.ok) throw new Error('Chat failed');
      const data = await response.json();
      setCardData(data);
      setChatInput("");
    } catch (error) {
       console.error(error);
       alert("Failed to update card.");
    } finally {
       setChatLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 dark:bg-slate-950 font-sans overflow-hidden">
      <header className="pixel-font bg-red-600 text-white p-4 text-center border-b-4 border-black shrink-0 relative shadow-xl z-10">
        <h1 className="text-2xl md:text-3xl tracking-widest drop-shadow-md">
          PokéPrompt
        </h1>
        <div className="absolute top-1/2 right-4 -translate-y-1/2 w-4 h-4 rounded-full bg-blue-400 border-2 border-white shadow-[0_0_10px_#60a5fa] animate-pulse hidden md:block"></div>
        <div className="absolute top-1/2 left-4 -translate-y-1/2 gap-1 hidden md:flex">
             <div className="w-3 h-3 rounded-full bg-red-800 border-2 border-white/50"></div>
             <div className="w-3 h-3 rounded-full bg-yellow-400 border-2 border-white/50"></div>
             <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white/50"></div>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Left Panel: Upload & Controls */}
        <div className="w-full md:w-1/2 h-full flex flex-col p-6 gap-4 overflow-y-auto bg-slate-50 relative border-r-4 border-black/10">
           { !image ? (
              <div className="flex-1 flex flex-col">
                  <UploadZone onImageSelected={handleImageSelected} isLoading={loading} className="flex-1 h-full" />
              </div>
           ) : (
             <Card className="p-4 flex flex-col gap-4 bg-white shadow-xl flex-1 justify-center animate-in slide-in-from-left-10 duration-500">
                <div className="relative aspect-video md:aspect-square rounded-none overflow-hidden border-4 border-black bg-slate-100 mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                    <img src={image} alt="Upload" className="object-contain w-full h-full" />
                    {loading && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10 overflow-hidden">
                             <div className="w-full h-32 bg-gradient-to-b from-transparent via-red-500/50 to-transparent absolute animate-scan left-0 z-20 -translate-y-1/2 pointer-events-none"></div>
                             <div className="w-full h-1 bg-red-500 shadow-[0_0_20px_rgba(239,68,68,1)] absolute animate-scan left-0 z-20"></div>
                             <div className="absolute inset-0 flex items-center justify-center z-30">
                                <div className="bg-black/60 px-4 py-2 rounded border border-white/20 backdrop-blur-md">
                                     <p className="font-pixel text-sm md:text-base text-white tracking-[0.2em] animate-pulse">SCANNING...</p>
                                </div>
                             </div>
                        </div>
                    )}
                </div>
                
                <div className="flex flex-col gap-4">
                    <Button variant="secondary" onClick={() => { setImage(null); setCardData(null); }} disabled={loading} className="w-full">
                    Cancel / New Image
                    </Button>
                </div>
             </Card>
           )}

           {cardData && (
             <Card className="p-4 flex flex-col gap-4 bg-yellow-50 border-2 border-yellow-600 shadow-[4px_4px_0px_0px_rgba(202,138,4,1)] animate-in slide-in-from-bottom-5">
                <h3 className="font-pixel text-xs md:text-sm flex items-center gap-2 text-yellow-800 uppercase tracking-wider">
                    <Sparkles className="h-4 w-4" />
                    Trainer Command
                </h3>
                <form onSubmit={handleChatSubmit} className="flex gap-2">
                    <Input 
                        placeholder="Ex: 'Make it a Water type'" 
                        value={chatInput} 
                        onChange={(e) => setChatInput(e.target.value)}
                        disabled={chatLoading} 
                        className="font-pixel text-xs active:scale-[0.99] transition-transform"
                    />
                    <Button type="submit" disabled={chatLoading} className="bg-yellow-500 text-yellow-950 hover:bg-yellow-400">
                        {chatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
             </Card>
           )}
        </div>

        {/* Right Panel: Card Preview */}
        <div className="w-full md:w-1/2 h-full flex justify-center items-center bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-slate-200 relative overflow-hidden p-8 md:p-12">
            
            {/* Background pattern or decoration */}
            <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black/20 via-transparent to-transparent"></div>

            {cardData ? (
                <PokemonCard data={cardData} imageUrl={image!} className="scale-100 md:scale-125 transition-all duration-700 hover:rotate-1 animate-in zoom-in-50 slide-in-from-right-10 shadow-2xl" />
            ) : (
                !loading && image && (
                    <div className="text-center text-muted-foreground flex flex-col items-center justify-center h-full gap-6 opacity-70 animate-pulse">
                         <Loader2 className="h-16 w-16 animate-spin text-red-500" />
                         <p className="font-pixel text-sm">Generating Data...</p>
                    </div>
                )
            )}
            
            {loading && image && <TerminalLoader />}
            
            {!image && !loading && (
                <div className="h-[400px] w-[300px] opacity-40 select-none pointer-events-none flex flex-col items-center justify-center gap-4">
                   <div className="w-full h-full border-4 border-dashed border-slate-400 rounded-lg flex items-center justify-center bg-slate-100/50">
                        <span className="font-pixel text-xs text-slate-500">Card Preview</span>
                   </div>
                </div>
            )}
        </div>

      </main>
    </div>
  )
}

export default App

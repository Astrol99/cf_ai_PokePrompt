import { useState, useRef, useEffect } from 'react'
import { UploadZone } from './components/UploadZone'
import { PokemonCard, type CardData } from './components/PokemonCard'
import { Button } from '@/components/ui/pixelact-ui/button'
import { Textarea } from '@/components/ui/pixelact-ui/textarea'
import { Spinner } from '@/components/ui/pixelact-ui/spinner'
import { Card } from '@/components/ui/pixelact-ui/card'
import { Loader2, Sparkles, Send } from 'lucide-react'
import html2canvas from 'html2canvas';

function App() {
  const [image, setImage] = useState<string | null>(null);
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'system', content: string }[]>([]);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory, chatLoading]);

  const handleImageSelected = async (base64: string) => {
    setImage(base64);
    setLoading(true);
    setCardData(null);
    setChatHistory([]); // Reset chat on new image
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

    const userMessage = chatInput.trim();
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput("");
    setChatLoading(true);

    try {
       const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            messages: [{ role: 'user', content: userMessage }],
            currentCard: cardData 
        }),
      });
      if (!response.ok) throw new Error('Chat failed');
      const data = await response.json();
      
      if (data.card && data.response) {
          setCardData(data.card);
          setChatHistory(prev => [...prev, { role: 'system', content: data.response }]);
      } else if (data.name) { 
          // Fallback if backend sends old format for some reason
          setCardData(data);
          setChatHistory(prev => [...prev, { role: 'system', content: "Card updated." }]);
      }
    } catch (error) {
       console.error(error);
       setChatHistory(prev => [...prev, { role: 'system', content: "Error updating card." }]);
       alert("Failed to update card.");
    } finally {
       setChatLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current || !cardData) return;
    
    try {
        const canvas = await html2canvas(cardRef.current, {
            backgroundColor: null, // Transparent background if possible, or use card's bg
            scale: 2, // Higher resolution
            useCORS: true // For images loaded from external URLs
        });
        
        const link = document.createElement('a');
        link.download = `pokeprompt-${cardData.name.toLowerCase().replace(/\s+/g, '-')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (err) {
        console.error("Download failed:", err);
        alert("Failed to download card.");
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 dark:bg-slate-950 font-sans overflow-hidden">
      <header className="pixel-font bg-red-600 text-white p-4 text-center border-b-4 border-black shrink-0 relative shadow-xl z-10">
        <h1 className="text-4xl md:text-5xl text-[#ffcb05] drop-shadow-[-4px_4px_0_#3c5aa6] [-webkit-text-stroke:2px_#3c5aa6]">
          PoKéPrompt
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
           { !image ? (
              <div className="flex-1 flex flex-col">
                  <UploadZone onImageSelected={handleImageSelected} isLoading={loading} className="flex-1 h-full" />
              </div>
           ) : !cardData ? (
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
           ) : (
             <Card className="p-6 flex flex-col gap-6 bg-yellow-50 border-4 border-yellow-600 shadow-[4px_4px_0px_0px_rgba(202,138,4,1)] animate-in slide-in-from-bottom-5 flex-1 h-full relative overflow-hidden">
                <div className="flex justify-between items-center border-b-2 border-yellow-600/20 pb-4">
                    <h3 className="font-pixel text-lg md:text-xl flex items-center gap-2 text-yellow-800 uppercase tracking-wider">
                        <Sparkles className="h-5 w-5" />
                        Trainer Command
                    </h3>
                    <Button 
                        size="sm"
                        onClick={() => { setImage(null); setCardData(null); }} 
                        className="text-xs text-yellow-800 hover:bg-yellow-200"
                    >
                        New Image
                    </Button>
                </div>

                <div ref={chatScrollRef} className="flex-1 flex flex-col gap-4 overflow-y-auto p-2 scroll-smooth">
                    {chatHistory.length === 0 ? (
                        <div className="flex-1 flex flex-col justify-center items-center opacity-30 text-yellow-800 text-center gap-2">
                            <Sparkles className="h-12 w-12" />
                            <p className="font-pixel text-sm max-w-[200px]">Enter commands to modify the generated card.</p>
                        </div>
                    ) : (
                        chatHistory.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs shadow-sm ${
                                    msg.role === 'user' 
                                        ? 'bg-blue-500 text-white rounded-br-none' 
                                        : 'bg-yellow-200 text-yellow-900 rounded-bl-none border border-yellow-400'
                                }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))
                    )}
                    {chatLoading && (
                        <div className="flex justify-start">
                             <div className="bg-yellow-200 text-yellow-900 rounded-lg rounded-bl-none border border-yellow-400 px-3 py-2 flex items-center gap-2">
                                <Spinner className="h-4 w-4" />
                                <span className="text-xs font-pixel">Updating...</span>
                             </div>
                        </div>
                    )}
                </div>

                <form onSubmit={handleChatSubmit} className="flex gap-2 shrink-0 items-end">
                    <Textarea 
                        placeholder="Ex: 'Make it a Water type'" 
                        value={chatInput} 
                        onChange={(e) => setChatInput(e.target.value)}
                        disabled={chatLoading} 
                        className="font-pixel text-sm min-h-[50px] max-h-[120px] active:scale-[0.99] transition-transform shadow-sm flex-1 resize-none py-3"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleChatSubmit(e);
                            }
                        }}
                    />
                    <Button type="submit" disabled={chatLoading} className="bg-yellow-500 text-yellow-950 hover:bg-yellow-400 h-14 w-14 shrink-0 shadow-md border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1">
                        {chatLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
                    </Button>
                </form>
             </Card>
           )}

        {/* Right Panel: Card Preview */}
        <div className="w-full md:w-1/2 h-full flex justify-center items-center bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-slate-200 relative overflow-hidden p-8 md:p-12">
            {cardData && (
                <Button 
                    onClick={handleDownload}
                    className="!absolute !bottom-6 !right-6 !h-14 !w-14 "
                    title="Download Card"
                >
                </Button>
            )}

            {/* Background pattern or decoration */}
            <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black/20 via-transparent to-transparent"></div>


            {cardData ? (
                    <div ref={cardRef}>
                        <PokemonCard data={cardData} imageUrl={image!} className="scale-100 md:scale-125 transition-all duration-700 hover:rotate-1 animate-in zoom-in-50 slide-in-from-right-10 shadow-2xl" />
                    </div>
            ) : (
                <div className="relative h-full w-[500px] flex items-center justify-center select-none pointer-events-none">
                     <div className={`w-full h-full border-4 border-dashed border-slate-400 rounded-lg flex items-center justify-center bg-slate-100/50 transition-all duration-500 ${loading ? 'blur-sm opacity-30 scale-95' : 'opacity-40'}`}>
                          <span className="font-pixel text-xs text-slate-500">Make a card out of anything...</span>
                     </div>
                     
                     {loading && (
                         <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 animate-in fade-in zoom-in duration-300">
                             <Spinner className="h-16 w-16" />
                             <p className="font-pixel text-sm animate-pulse tracking-widest text-slate-500 bg-white/50 px-2 rounded backdrop-blur-sm">PROCESSING...</p>
                         </div>
                     )}
                </div>
            )}
        </div>
      </main>
    </div>
  )
}

export default App

import { useState, useRef, useEffect } from 'react'
import { UploadZone } from './components/UploadZone'
import { PokemonCard, type CardData } from './components/PokemonCard'
import { Button } from '@/components/ui/pixelact-ui/button'
import { Textarea } from '@/components/ui/pixelact-ui/textarea'
import { Spinner } from '@/components/ui/pixelact-ui/spinner'
import { Card } from '@/components/ui/pixelact-ui/card'
import { Loader2, Sparkles, LogOut, Library } from 'lucide-react'
import { toPng } from 'html-to-image';
import confetti from 'canvas-confetti';
import { authClient } from './lib/auth';
import { Avatar } from '@/components/ui/pixelact-ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/pixelact-ui/dialog'

// API URL from environment variable (empty for dev proxy, full URL for production)
const API_URL = import.meta.env.VITE_API_URL || '';

function App() {
  const [image, setImage] = useState<string | null>(null);
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'system', content: string }[]>([]);
  const [shouldCelebrate, setShouldCelebrate] = useState(false);
  
  const [isDeckOpen, setIsDeckOpen] = useState(false);
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const { data: session } = authClient.useSession();

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory, chatLoading]);

  // Confetti celebration after card renders
  useEffect(() => {
    if (shouldCelebrate && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = rect.top / window.innerHeight;
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { x, y }
      });
      
      setShouldCelebrate(false);
    }
  }, [shouldCelebrate, cardData]);

  // Fetch deck when opening modal
  useEffect(() => {
      if (isDeckOpen && session) {
          fetch(`${API_URL}/api/cards`, {
            credentials: 'include'
          })
            .then(res => res.json())
            .then(data => {
              if (Array.isArray(data)) setSavedCards(data);
            })
            .catch(console.error);
      }
  }, [isDeckOpen, session]);

  const handleImageSelected = async (base64: string) => {
    setImage(base64);
    setLoading(true);
    setCardData(null);
    setChatHistory([]); // Reset chat on new image
    try {
      const response = await fetch(`${API_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });
      if (!response.ok) throw new Error('Generation failed');
      const data = await response.json();
      setCardData(data);
      setShouldCelebrate(true); // Trigger celebration after render
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
       const response = await fetch(`${API_URL}/api/chat`, {
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
          // Merge partial updates with existing card data
          setCardData(prev => prev ? { ...prev, ...data.card } : data.card);
          setChatHistory(prev => [...prev, { role: 'system', content: data.response }]);
      } else if (data.name) { 
          // Fallback if backend sends old format for some reason
          setCardData(prev => prev ? { ...prev, ...data } : data);
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
        const dataUrl = await toPng(cardRef.current, {
            quality: 1,
            pixelRatio: 3,
            cacheBust: true,
            style: {
                transform: 'none', // Remove the scale-125 for accurate export
            }
        });
        
        const link = document.createElement('a');
        link.download = `pokeprompt-${cardData.name.toLowerCase().replace(/\s+/g, '-')}.png`;
        link.href = dataUrl;
        link.click();
    } catch (err) {
        console.error("Download failed:", err);
        alert("Failed to download card.");
    }
  };

  const handleSaveToDeck = async () => {
      if (!session) {
          alert("Please login to save cards!");
          return;
      }
      if (!cardData) return;

      setIsSaving(true);
      try {
          const res = await fetch(`${API_URL}/api/cards`, {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({ card: cardData, image })
          });
          if(res.ok) {
              setShowSaveSuccess(true);
          } else {
              throw new Error("Failed to save");
          }
      } catch (e) {
          console.error(e);
          alert("Error saving card.");
      } finally {
          setIsSaving(false);
      }
  };

  const handleLogin = async () => {
      await authClient.signIn.social({
          provider: "google",
          callbackURL: window.location.href 
      });
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 dark:bg-slate-950 font-sans overflow-hidden">
      <header className="pixel-font bg-red-600 text-white p-4 text-center border-b-4 border-black shrink-0 relative shadow-xl z-[100] flex justify-between items-center">
        <div className="w-20 hidden md:block"></div> {/* Spacer */}
        
        <h1 className="text-4xl md:text-5xl text-[#ffcb05] drop-shadow-[-4px_4px_0_#3c5aa6] [-webkit-text-stroke:2px_#3c5aa6]">
          PoKéPrompt
        </h1>

        <div className="flex gap-2 items-center w-auto md:w-40 justify-end">
            {session ? (
                <div className="flex items-center gap-2 relative">
                    <Button variant="secondary" size="sm" onClick={() => setIsDeckOpen(true)} className="hidden md:flex gap-1 items-center">
                        <Library className="h-4 w-4" /> Deck
                    </Button>
                    
                    {/* User Menu Group */}
                    <div className="relative group py-2"> {/* Added vertical padding to bridge gap */}
                         <div className="cursor-pointer transition-transform hover:scale-105 active:scale-95">
                             <Avatar 
                                src={session.user.image} 
                                fallback={session.user.name} 
                                alt={session.user.name}
                                className="border-2 border-white cursor-pointer"
                             />
                         </div>
                         
                         {/* Dropdown Menu */}
                         <div className="absolute right-0 top-[90%] pt-2 hidden group-hover:block z-50 min-w-[120px]">
                             <div className="bg-white border-4 border-black shadow-[4px_4px_0_0_#000] p-1 flex flex-col gap-1">
                                 <div className="px-2 py-1 text-xs font-pixel border-b-2 border-slate-100 mb-1 truncate max-w-[150px]">
                                     {session.user.name}
                                 </div>
                                 <Button 
                                    size="sm" 
                                    onClick={() => authClient.signOut()} 
                                    className="bg-red-500 hover:bg-red-400 text-white w-full justify-start h-8 text-xs"
                                 >
                                     <LogOut className="h-3 w-3 mr-2" /> Logout
                                 </Button>
                             </div>
                         </div>
                    </div>
                </div>
            ) : (
                <Button onClick={handleLogin} className="bg-blue-500 hover:bg-blue-600 text-white text-xs md:text-sm">
                    Login
                </Button>
            )}
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
             <Card className="p-6 flex flex-col gap-6 bg-yellow-50 border-4 border-yellow-600 shadow-[4px_4px_0px_0px_rgba(202,138,4,1)] animate-in slide-in-from-bottom-5 h-1/2 md:h-full md:flex-1 relative overflow-hidden order-2 md:order-1">
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

                <form onSubmit={handleChatSubmit} className="flex gap-2 items-center">
                    <Textarea 
                        placeholder="Ex: 'Make it a Water type'" 
                        value={chatInput} 
                        onChange={(e) => setChatInput(e.target.value)}
                        disabled={chatLoading} 
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleChatSubmit(e);
                            }
                        }}
                    />
                    <Button type="submit" disabled={chatLoading} className="bg-yellow-500 text-yellow-950 hover:bg-yellow-400 h-14 w-14 shrink-0 shadow-md border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1">
                        {chatLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                                <polygon points="23 11 23 13 22 13 22 14 21 14 21 15 20 15 20 16 19 16 19 17 18 17 18 18 17 18 17 19 16 19 16 20 15 20 15 21 14 21 14 22 13 22 13 23 12 23 12 22 11 22 11 21 10 21 10 20 11 20 11 19 12 19 12 18 13 18 13 17 14 17 14 16 15 16 15 15 16 15 16 14 1 14 1 10 16 10 16 9 15 9 15 8 14 8 14 7 13 7 13 6 12 6 12 5 11 5 11 4 10 4 10 3 11 3 11 2 12 2 12 1 13 1 13 2 14 2 14 3 15 3 15 4 16 4 16 5 17 5 17 6 18 6 18 7 19 7 19 8 20 8 20 9 21 9 21 10 22 10 22 11 23 11"/>
                            </svg>
                        )}
                    </Button>
                </form>
             </Card>
           )}

        {/* Right Panel: Card Preview */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full flex justify-center items-center bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-slate-200 relative overflow-hidden p-4 md:p-12 order-1 md:order-2">
            {cardData && (
                <>
                <div className="absolute top-6 right-6 flex flex-col gap-2 z-50">
                     <Button 
                        onClick={handleDownload}
                        className="h-14 w-14 bg-blue-500 hover:bg-blue-400 border-4 border-black shadow-[4px_4px_0_0_#000]"
                        title="Download Card"
                    >
                        <svg id="download-solid" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 fill-white"><rect x="2" y="20" width="20" height="3"/><polygon points="20 8 20 10 19 10 19 11 18 11 18 12 17 12 17 13 16 13 16 14 15 14 15 15 14 15 14 16 13 16 13 17 11 17 11 16 10 16 10 15 9 15 9 14 8 14 8 13 7 13 7 12 6 12 6 11 5 11 5 10 4 10 4 8 5 8 5 7 7 7 7 8 8 8 8 9 9 9 9 10 10 10 10 1 14 1 14 10 15 10 15 9 16 9 16 8 17 8 17 7 19 7 19 8 20 8"/></svg>
                    </Button>
                    {session && (
                         <Button 
                            onClick={handleSaveToDeck}
                            disabled={isSaving}
                            className="h-14 w-14 bg-green-500 hover:bg-green-400 border-4 border-black shadow-[4px_4px_0_0_#000]"
                            title="Save to Deck"
                        >
                            {isSaving ? <Spinner className="h-6 w-6 text-white" /> : <Library className="h-6 w-6 text-white" />}
                        </Button>
                    )}
                </div>
                </>
            )}

            {/* Background pattern or decoration */}
            <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black/20 via-transparent to-transparent"></div>


            {cardData ? (
                    <div className="scale-50 md:scale-125 transition-all duration-700 hover:rotate-2 animate-in zoom-in-50 slide-in-from-right-10">
                        <div ref={cardRef}>
                            <PokemonCard data={cardData} imageUrl={image!} className="shadow-2xl" />
                        </div>
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

      {/* Success Dialog */}
      <Dialog open={showSaveSuccess} onOpenChange={setShowSaveSuccess}>
          <DialogContent className="border-green-600 bg-green-50">
              <DialogHeader>
                  <DialogTitle className="text-green-800 flex items-center gap-2">
                       <Sparkles className="h-6 w-6" /> Success!
                  </DialogTitle>
              </DialogHeader>
              <p className="font-pixel text-sm my-4 text-green-900">
                  Your card has been safely stored in your deck.
              </p>
              <DialogFooter>
                  <Button onClick={() => setShowSaveSuccess(false)} className="bg-green-600 text-white hover:bg-green-500">
                      Awesome!
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      {/* Deck Modal */}
      <Dialog open={isDeckOpen} onOpenChange={setIsDeckOpen}>
          <DialogContent className="w-full max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden bg-slate-100 border-4 border-black shadow-2xl">
                   <div className="p-4 border-b-4 border-black flex justify-between items-center bg-red-600 text-white shrink-0">
                       <DialogTitle className="text-2xl flex items-center gap-2 text-white"><Library /> My Deck</DialogTitle>
                       <Button onClick={() => setIsDeckOpen(false)} className="bg-red-800 hover:bg-red-900 border-white text-white">Close</Button>
                   </div>
                   <div className="flex-1 overflow-y-auto p-8 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-slate-200">
                       {savedCards.length === 0 ? (
                           <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
                               <Library className="h-16 w-16 opacity-50" />
                               <p className="font-pixel text-xl">Your deck is empty!</p>
                               <p className="text-sm">Generate some cards and save them here.</p>
                           </div>
                       ) : (
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                               {savedCards.map((card) => {
                                   const cardContent = typeof card.data === 'string' ? JSON.parse(card.data) : card.data;
                                   return (
                                       <div key={card.id} className="scale-75 origin-top-left">
                                          <PokemonCard data={cardContent} imageUrl={card.imageUrl || "https://via.placeholder.com/400"} />
                                       </div>
                                   );
                               })}
                           </div>
                       )}
                   </div>
          </DialogContent>
      </Dialog>
    </div>
  )
}

export default App

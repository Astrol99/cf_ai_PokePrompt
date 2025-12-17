import { useState } from 'react'
import { UploadZone } from './components/UploadZone'
import { PokemonCard, type CardData } from './components/PokemonCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Loader2, Sparkles, Send } from 'lucide-react'

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans p-4 md:p-8 flex flex-col items-center">
      <header className="mb-8 text-center space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500">
          PokePrompt
        </h1>
        <p className="text-muted-foreground">Turn any image into a TCG card with AI</p>
      </header>

      <main className="w-full max-w-5xl flex flex-col md:flex-row gap-8 items-start justify-center">
        
        {/* Left Panel: Upload & Controls */}
        <div className="w-full md:w-1/3 flex flex-col gap-4">
           { !image ? (
              <UploadZone onImageSelected={handleImageSelected} isLoading={loading} />
           ) : (
             <Card className="p-4 flex flex-col gap-4">
                <div className="relative aspect-square rounded-md overflow-hidden border">
                    <img src={image} alt="Upload" className="object-cover w-full h-full" />
                    {loading && (
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white backdrop-blur-sm">
                             <Loader2 className="h-8 w-8 animate-spin mb-2" />
                             <p className="font-semibold animate-pulse">Analyzing...</p>
                        </div>
                    )}
                </div>
                <Button variant="outline" onClick={() => { setImage(null); setCardData(null); }} disabled={loading}>
                    Upload New Image
                </Button>
             </Card>
           )}

           {cardData && (
             <Card className="p-4 flex flex-col gap-4">
                <h3 className="font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    Edit Card
                </h3>
                <form onSubmit={handleChatSubmit} className="flex gap-2">
                    <Input 
                        placeholder="e.g. Make it Fire type..." 
                        value={chatInput} 
                        onChange={(e) => setChatInput(e.target.value)}
                        disabled={chatLoading} 
                    />
                    <Button type="submit" size="icon" disabled={chatLoading}>
                        {chatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
             </Card>
           )}
        </div>

        {/* Right Panel: Card Preview */}
        <div className="w-full md:w-2/3 flex justify-center items-start min-h-[500px]">
           {cardData ? (
               <PokemonCard data={cardData} imageUrl={image!} className="animate-in zoom-in duration-500" />
           ) : (
               !loading && image && (
                   <div className="text-center text-muted-foreground flex flex-col items-center justify-center h-full gap-4 opacity-50">
                        <Loader2 className="h-10 w-10 animate-spin" />
                        <p>Generating Metadata...</p>
                   </div>
               )
           )}
           {!image && !loading && (
               <div className="h-[400px] w-[300px] border-2 border-dashed rounded-xl flex items-center justify-center text-muted-foreground opacity-20 select-none pointer-events-none">
                  Card Preview
               </div>
           )}
        </div>

      </main>
    </div>
  )
}

export default App

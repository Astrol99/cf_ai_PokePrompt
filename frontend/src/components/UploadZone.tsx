import React from 'react';
import { Card, CardContent } from "@/components/ui/pixelact-ui/card";
import { cn } from "@/lib/utils";


interface UploadZoneProps {
  onImageSelected: (base64: string) => void;
  isLoading: boolean;
}

export function UploadZone({ onImageSelected, isLoading, className }: UploadZoneProps & { className?: string }) {
  // ... existing handlers ...
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageSelected(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (isLoading) return;
    const file = e.dataTransfer.files?.[0];
     if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageSelected(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Card className={cn("border-4 border-dashed border-black/20 transition-all hover:border-red-500/50 hover:bg-red-50/50 cursor-pointer relative overflow-hidden group", isLoading && "opacity-50 pointer-events-none", className)}>
      <CardContent className="flex flex-col items-center justify-center h-full w-full py-10 space-y-6"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-upload")?.click()}
      >
        <div className="p-6 bg-red-100 rounded-full group-hover:scale-110 transition-transform duration-300 border-4 border-red-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-red-500"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>
        </div>
        <div className="text-center space-y-2 z-10">
            <h3 className="font-pixel text-xl uppercase tracking-widest text-slate-800">Upload Image</h3>
            <p className="font-pixel text-xs text-slate-400">Drag & drop or click</p>
        </div>
        
        {/* Decorative accents */}
        <div className="absolute top-2 right-2 w-2 h-2 bg-black/10 rounded-full"></div>
        <div className="absolute top-2 left-2 w-2 h-2 bg-black/10 rounded-full"></div>
        <div className="absolute bottom-2 right-2 w-2 h-2 bg-black/10 rounded-full"></div>
        <div className="absolute bottom-2 left-2 w-2 h-2 bg-black/10 rounded-full"></div>

        <input 
            id="file-upload" 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileChange}
            disabled={isLoading}
        />
      </CardContent>
    </Card>
  );
}

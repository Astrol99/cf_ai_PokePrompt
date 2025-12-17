import React from 'react';
import { Card, CardContent } from "@/components/ui/pixelact-ui/card";
import { cn } from "@/lib/utils";


interface UploadZoneProps {
  onImageSelected: (base64: string) => void;
  isLoading: boolean;
}

export function UploadZone({ onImageSelected, isLoading }: UploadZoneProps) {
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
    <Card className={cn("border-2 border-dashed transition-colors hover:border-primary/50 cursor-pointer", isLoading && "opacity-50 pointer-events-none")}>
      <CardContent className="flex flex-col items-center justify-center py-10 space-y-4"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-upload")?.click()}
      >
        <div className="p-4 bg-muted rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-muted-foreground"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>
        </div>
        <div className="text-center">
            <h3 className="font-semibold text-lg">Upload an image</h3>
            <p className="text-sm text-muted-foreground">Drag and drop or click to browse</p>
        </div>
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

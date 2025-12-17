import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
    src?: string | null;
    alt?: string;
    fallback?: string;
    size?: 'sm' | 'md' | 'lg';
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
    ({ className, src, alt, fallback, size = 'md', ...props }, ref) => {
        const [error, setError] = useState(false);

        const sizeClasses = {
            sm: 'h-8 w-8',
            md: 'h-10 w-10',
            lg: 'h-14 w-14'
        };

        return (
            <div
                ref={ref}
                className={cn(
                    "relative inline-flex shrink-0 overflow-hidden bg-slate-200 border-2 border-black shadow-[2px_2px_0_0_#000]",
                    sizeClasses[size],
                    className
                )}
                {...props}
            >
                {src && !error ? (
                    <img
                        src={src}
                        alt={alt}
                        className="aspect-square h-full w-full object-cover"
                        onError={() => setError(true)}
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-300 text-slate-600 font-pixel text-[10px]">
                        {fallback ? (
                            fallback.slice(0, 2).toUpperCase()
                        ) : (
                            <User className="h-1/2 w-1/2" />
                        )}
                    </div>
                )}
            </div>
        );
    }
);
Avatar.displayName = 'Avatar';

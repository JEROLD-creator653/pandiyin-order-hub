
import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

// --- 1. Global / Page Loader ---
interface LoaderProps {
    className?: string;
    text?: string;
    size?: 'sm' | 'md' | 'lg';
    delay?: number; // Delay in ms before showing
}

const SmallFallingLeaf = ({ size }: { size: number }) => (
    <svg width={size} height={Math.round(size * 1.33)} viewBox="0 0 48 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
        <path d="M24 2C24 2 4 18 4 38C4 50 12 58 24 58C36 58 44 50 44 38C44 18 24 2 24 2Z" className="fill-primary/80" />
        <path d="M24 10V50" className="stroke-primary-foreground/25" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M24 20L14 28M24 28L12 36M24 36L16 42" className="stroke-primary-foreground/15" strokeWidth="0.8" strokeLinecap="round" />
        <path d="M24 20L34 28M24 28L36 36M24 36L32 42" className="stroke-primary-foreground/15" strokeWidth="0.8" strokeLinecap="round" />
        <path d="M24 54L24 62" className="stroke-primary/60" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

export const Loader = ({ className, text, size = 'md', delay = 200 }: LoaderProps) => {
    const [show, setShow] = React.useState(delay === 0);

    React.useEffect(() => {
        if (delay > 0) {
            const timer = setTimeout(() => setShow(true), delay);
            return () => clearTimeout(timer);
        }
    }, [delay]);

    if (!show) return null;

    const leafSize = { sm: 28, md: 36, lg: 44 }[size];

    return (
        <div className={cn("flex flex-col items-center justify-center min-h-[50vh] w-full", className)}>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-6"
            >
                <motion.div
                    initial={{ y: -40, opacity: 0, rotate: -15 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                    <motion.div
                        animate={{
                            y: [0, 5, 12, 7, 16, 10, 18, 12, 5, 0],
                            x: [0, 10, 5, -6, -12, -5, 6, 12, 6, 0],
                            rotate: [0, 6, 12, 5, -3, -10, -6, 2, 8, 0],
                        }}
                        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <SmallFallingLeaf size={leafSize} />
                    </motion.div>
                </motion.div>

                <motion.div
                    className="rounded-full bg-foreground/5"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: leafSize, height: 4, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                >
                    <motion.div
                        className="w-full h-full rounded-full bg-foreground/5"
                        animate={{ scaleX: [1, 1.1, 0.9, 1] }}
                        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                    />
                </motion.div>

                {text && (
                    <p className="text-muted-foreground/70 text-sm font-medium tracking-wide animate-pulse">
                        {text}
                    </p>
                )}
            </motion.div>
        </div>
    );
};


// --- 2. Button Loader ---
interface ButtonLoaderProps {
    className?: string;
    text?: string;
}

export const ButtonLoader = ({ className, text = "Processing..." }: ButtonLoaderProps) => {
    return (
        <motion.span 
            className={cn("flex items-center gap-2", className)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
        >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{text}</span>
        </motion.span>
    );
};


// --- 3. Skeleton Card (Product) Skeleton ---
interface SkeletonCardProps {
    className?: string;
    count?: number;
}

export const SkeletonCard = ({ className, count = 1 }: SkeletonCardProps) => {
    return (
        <div className={cn("grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6", className)}>
            {Array.from({ length: count }).map((_, i) => (
                <motion.div 
                    key={i} 
                    className="flex flex-col gap-4 p-4 border rounded-xl bg-card/50 h-full"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.2 }}
                >
                    {/* Image Skeleton */}
                    <Skeleton className="w-full aspect-square rounded-lg" />

                    {/* Content Skeleton */}
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>

                    {/* Price & Action Skeleton */}
                    <div className="mt-auto flex items-center justify-between pt-2">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                </motion.div>
            ))}
        </div>
    );
};


// --- 4. Table Skeleton (Admin) ---
interface TableSkeletonProps {
    rows?: number;
    columns?: number;
    className?: string;
}

export const TableSkeleton = ({ rows = 5, columns = 4, className }: TableSkeletonProps) => {
    return (
        <motion.div 
            className={cn("w-full overflow-hidden rounded-md border bg-card", className)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
        >
            {/* Header */}
            <div className="flex items-center gap-4 border-b bg-muted/50 p-4">
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={`header-${i}`} className="h-5 w-full" />
                ))}
            </div>

            {/* Rows */}
            <div className="divide-y">
                {Array.from({ length: rows }).map((_, r) => (
                    <motion.div 
                        key={`row-${r}`} 
                        className="flex items-center gap-4 p-4"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: r * 0.05, duration: 0.2 }}
                    >
                        {Array.from({ length: columns }).map((_, c) => (
                            <Skeleton key={`cell-${r}-${c}`} className="h-4 w-full" />
                        ))}
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

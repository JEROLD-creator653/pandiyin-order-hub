
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

const SCATTER_CFG = [
    { size: 36, endX: -45, endY: -38, endRotate: -30, drift: { x: [-2, 3, -2], y: [-2, 2, -1] }, duration: 5.5, delay: 0, opacity: 0.9 },
    { size: 30, endX: 42, endY: -30, endRotate: 25, drift: { x: [2, -2, 3], y: [1, -3, 1] }, duration: 6.0, delay: 0.1, opacity: 0.85 },
    { size: 32, endX: 8, endY: 48, endRotate: 40, drift: { x: [-2, 4, -1], y: [1, -2, 2] }, duration: 5.8, delay: 0.2, opacity: 0.88 },
    { size: 18, endX: -55, endY: 28, endRotate: -45, drift: { x: [1, -2, 1], y: [-1, 2, -1] }, duration: 7.0, delay: 0.15, opacity: 0.5 },
    { size: 15, endX: 50, endY: 35, endRotate: 50, drift: { x: [-1, 3, -1], y: [2, -1, 1] }, duration: 7.5, delay: 0.25, opacity: 0.4 },
];

const InlineLeafSVG = ({ size, detailed = true }: { size: number; detailed?: boolean }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
        <path d="M32 4C32 4 8 20 8 40C8 52 18 60 32 60C46 60 56 52 56 40C56 20 32 4 32 4Z" className="fill-primary/85" />
        <path d="M32 14V52" className="stroke-primary-foreground/30" strokeWidth="1.5" strokeLinecap="round" />
        {detailed && (
            <>
                <path d="M32 24L20 32M32 32L18 40M32 40L22 46" className="stroke-primary-foreground/20" strokeWidth="1" strokeLinecap="round" />
                <path d="M32 24L44 32M32 32L46 40M32 40L42 46" className="stroke-primary-foreground/20" strokeWidth="1" strokeLinecap="round" />
            </>
        )}
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

    const containerSize = { sm: 'w-24 h-24', md: 'w-32 h-32', lg: 'w-40 h-40' }[size];
    const scale = { sm: 0.6, md: 0.8, lg: 1 }[size];

    return (
        <div className={cn("flex flex-col items-center justify-center min-h-[50vh] w-full", className)}>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-6"
            >
                <div className={cn("relative", containerSize)}>
                    {SCATTER_CFG.map((leaf, i) => (
                        <motion.div
                            key={i}
                            className="absolute"
                            style={{ top: '50%', left: '50%', marginTop: -leaf.size / 2, marginLeft: -leaf.size / 2 }}
                            initial={{ x: 0, y: 0, scale: 0, opacity: 0, rotate: 0 }}
                            animate={{
                                x: leaf.endX * scale,
                                y: leaf.endY * scale,
                                scale: scale,
                                opacity: leaf.opacity,
                                rotate: leaf.endRotate,
                            }}
                            transition={{
                                duration: 1.2,
                                delay: leaf.delay,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                        >
                            <motion.div
                                animate={{
                                    x: leaf.drift.x,
                                    y: leaf.drift.y,
                                    rotate: [0, leaf.endRotate * 0.15, -leaf.endRotate * 0.1, 0],
                                }}
                                transition={{
                                    duration: leaf.duration,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                            >
                                <InlineLeafSVG size={leaf.size} detailed={i < 3} />
                            </motion.div>
                        </motion.div>
                    ))}
                </div>
                {text && (
                    <p className="text-muted-foreground/80 text-sm font-medium tracking-wide animate-pulse">
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

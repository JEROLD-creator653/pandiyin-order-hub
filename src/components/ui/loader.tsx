
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

export const Loader = ({ className, text, size = 'md', delay = 200 }: LoaderProps) => {
    const [show, setShow] = React.useState(delay === 0);

    React.useEffect(() => {
        if (delay > 0) {
            const timer = setTimeout(() => setShow(true), delay);
            return () => clearTimeout(timer);
        }
    }, [delay]);

    if (!show) return null;

    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    return (
        <div className={cn("flex flex-col items-center justify-center min-h-[50vh] w-full", className)}>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center gap-4"
            >
                <div className="relative">
                    <div className={cn("rounded-full border-2 border-primary/20", sizeClasses[size])} />
                    <div
                        className={cn(
                            "absolute top-0 left-0 rounded-full border-2 border-primary border-t-transparent animate-spin",
                            sizeClasses[size]
                        )}
                    />
                    {/* Subtle glow effect */}
                    <div className={cn("absolute top-0 left-0 rounded-full bg-primary/20 blur-xl", sizeClasses[size])} />
                </div>
                {text && (
                    <p className="text-muted-foreground text-sm font-medium animate-pulse">
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

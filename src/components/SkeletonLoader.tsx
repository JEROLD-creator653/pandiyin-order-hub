import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  count?: number;
  variant?: 'product' | 'banner' | 'text' | 'card';
  className?: string;
}

export default function SkeletonLoader({
  count = 1,
  variant = 'card',
  className = '',
}: SkeletonLoaderProps) {
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0.5 },
    visible: { opacity: 1 },
  };

  const skeletonConfigs = {
    product: (key: number) => (
      <motion.div key={key} className={`space-y-3 ${className}`}>
        <Skeleton className="aspect-square rounded-lg" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-8 w-full" />
      </motion.div>
    ),
    banner: (key: number) => (
      <motion.div key={key} className={className}>
        <Skeleton className="w-full aspect-video rounded-lg" />
      </motion.div>
    ),
    text: (key: number) => (
      <motion.div key={key} className={`space-y-2 ${className}`}>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </motion.div>
    ),
    card: (key: number) => (
      <motion.div key={key} className={`p-4 rounded-lg bg-card space-y-3 ${className}`}>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-8 w-1/4" />
      </motion.div>
    ),
  };

  const skeletons = Array.from({ length: count }, (_, i) =>
    skeletonConfigs[variant](i)
  );

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className={variant === 'product' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4' : 'space-y-3'}
    >
      {skeletons}
    </motion.div>
  );
}

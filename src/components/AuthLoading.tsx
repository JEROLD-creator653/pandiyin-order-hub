import { Skeleton } from '@/components/ui/skeleton';

interface AuthLoadingProps {
  height?: number;
}

/**
 * Loading skeleton to show while authentication is being restored
 * This prevents layout jump and unclear behavior during session restoration
 */
export default function AuthLoading({ height = 256 }: AuthLoadingProps) {
  return (
    <div className="container mx-auto px-4 pt-24 pb-8 max-w-3xl">
      <Skeleton className={`w-full h-${height} rounded-lg`} />
    </div>
  );
}

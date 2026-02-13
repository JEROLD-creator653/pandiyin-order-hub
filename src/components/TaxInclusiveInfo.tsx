/**
 * Tax Inclusive Information Component
 * Displays "Inclusive of all taxes" messaging for GST-inclusive pricing
 */

import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaxInclusiveInfoProps {
  variant?: 'badge' | 'subtitle' | 'note' | 'checkout';
  className?: string;
  showIcon?: boolean;
}

export default function TaxInclusiveInfo({
  variant = 'subtitle',
  className,
  showIcon = true,
}: TaxInclusiveInfoProps) {
  switch (variant) {
    case 'badge':
      // Small inline badge style
      return (
        <span className={cn(
          'inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded',
          className
        )}>
          {showIcon && <AlertCircle className="h-3 w-3" />}
          Inclusive of all taxes
        </span>
      );

    case 'subtitle':
      // Small subtitle below price on product page
      return (
        <p className={cn(
          'text-xs text-muted-foreground italic',
          className
        )}>
          Inclusive of all taxes
        </p>
      );

    case 'note':
      // Informational note style
      return (
        <div className={cn(
          'flex items-start gap-2 text-sm bg-blue-50 border border-blue-200 rounded-lg p-3',
          className
        )}>
          {showIcon && <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />}
          <p className="text-blue-800">
            <span className="font-medium">All prices are inclusive of all applicable taxes.</span>
            <br />
            No additional tax will be added during checkout.
          </p>
        </div>
      );

    case 'checkout':
      // Checkout page tax breakdown info
      return (
        <div className={cn(
          'space-y-2 text-sm bg-gray-50 border border-gray-200 rounded-lg p-4',
          className
        )}>
          <p className="font-medium text-gray-900">Tax Breakdown</p>
          <p className="text-muted-foreground">
            All listed prices are inclusive of applicable GST. The tax amount shown below is 
            for informational and invoice purposes only and is already included in the prices above.
          </p>
        </div>
      );

    default:
      return null;
  }
}

import { memo } from 'react';
import PolicyLayout from '@/components/PolicyLayout';
import { shippingPolicy } from '@/data/policies';

function ShippingPolicy() {
  return (
    <PolicyLayout
      title={shippingPolicy.title}
      lastUpdated={shippingPolicy.lastUpdated}
      content={shippingPolicy.content}
    />
  );
}

export default memo(ShippingPolicy);

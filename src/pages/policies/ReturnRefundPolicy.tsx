import { memo } from 'react';
import PolicyLayout from '@/components/PolicyLayout';
import { returnRefundPolicy } from '@/data/policies';

function ReturnRefundPolicy() {
  return (
    <PolicyLayout
      title={returnRefundPolicy.title}
      lastUpdated={returnRefundPolicy.lastUpdated}
      content={returnRefundPolicy.content}
    />
  );
}

export default memo(ReturnRefundPolicy);

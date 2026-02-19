import { memo } from 'react';
import PolicyLayout from '@/components/PolicyLayout';
import { cancellationPolicy } from '@/data/policies';

function CancellationPolicy() {
  return (
    <PolicyLayout
      title={cancellationPolicy.title}
      lastUpdated={cancellationPolicy.lastUpdated}
      content={cancellationPolicy.content}
    />
  );
}

export default memo(CancellationPolicy);

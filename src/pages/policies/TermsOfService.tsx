import { memo } from 'react';
import PolicyLayout from '@/components/PolicyLayout';
import { termsOfService } from '@/data/policies';

function TermsOfService() {
  return (
    <PolicyLayout
      title={termsOfService.title}
      lastUpdated={termsOfService.lastUpdated}
      content={termsOfService.content}
    />
  );
}

export default memo(TermsOfService);

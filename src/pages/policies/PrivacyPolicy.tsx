import { memo } from 'react';
import PolicyLayout from '@/components/PolicyLayout';
import { privacyPolicy } from '@/data/policies';

function PrivacyPolicy() {
  return (
    <PolicyLayout
      title={privacyPolicy.title}
      lastUpdated={privacyPolicy.lastUpdated}
      content={privacyPolicy.content}
    />
  );
}

export default memo(PrivacyPolicy);

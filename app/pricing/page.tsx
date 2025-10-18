import { Suspense } from 'react';
import PricingContent from './PricingContent';

export const dynamic = 'force-dynamic'; // optional, but safe if you rely on runtime params

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="text-center text-white mt-20">Loading...</div>}>
      <PricingContent />
    </Suspense>
  );
}
